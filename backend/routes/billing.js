const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const paystack = require("../services/paystack");
const { logActivity } = require('../services/activityLogger');
const prisma = new PrismaClient();

const PLANS = {
  STARTER: { monthly: 0, yearly: 0, maxUsers: 1, maxProducts: 200 },
  BASIC:   { monthly: 149, yearly: 1520, maxUsers: 3, maxProducts: 1000 },
  PRO:     { monthly: 349, yearly: 3560, maxUsers: 8, maxProducts: 5000 },
  ENTERPRISE: { monthly: 799, yearly: 8150, maxUsers: 999999, maxProducts: 999999 }
};

// ─── GET BILLING INFO ──────────────────────────
router.get("/info", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: req.tenant.id }
    });

    const payments = await prisma.payment.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const plan = PLANS[subscription?.plan] || PLANS.STARTER;

    res.json({
      subscription,
      payments,
      planDetails: plan,
      plans: PLANS
    });
  } catch (error) {
    console.error("Billing info error:", error);
    res.status(500).json({ message: "Failed to fetch billing info" });
  }
});

// ─── INITIATE SUBSCRIPTION PAYMENT ─────────────
router.post("/subscribe", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { subscription: true }
    });

    const amount = billingCycle === "YEARLY" ? PLANS[plan].yearly : PLANS[plan].monthly;

    if (amount === 0) {
      // Free plan
      await prisma.subscription.update({
        where: { tenantId: req.tenant.id },
        data: {
          plan,
          billingCycle: billingCycle || "MONTHLY",
          status: "ACTIVE",
          priceMonthly: 0,
          priceYearly: 0
        }
      });

      await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: { status: "ACTIVE" }
      });

      await logActivity({
        tenantId: tenant.id,
        action: 'SUBSCRIPTION_UPGRADE',
        metadata: { plan: plan, amount: 0, method: 'FREE' },
        req,
      });

      return res.json({ message: "Subscribed to free plan successfully" });
    }

    // Use Paystack standard checkout — handles Card, MoMo, Bank Transfer automatically
    const transaction = await paystack.initializeTransaction({
      email: tenant.email,
      amount: amount * 100, // Paystack expects pesewas
      metadata: {
        tenantId: tenant.id,
        plan,
        billingCycle,
        type: "subscription"
      },
      channels: ["card", "mobile_money"] // Enable both card and MoMo
    });

    res.json({
      message: "Payment initiated",
      authorizationUrl: transaction.data.authorization_url,
      reference: transaction.data.reference
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ message: "Failed to initiate subscription: " + error.message });
  }
});

// ─── VERIFY OTP FOR MoMo ───────────────────────
router.post("/verify-otp", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { reference, otp } = req.body;

    if (!reference || !otp) {
      return res.status(400).json({ message: "Reference and OTP are required" });
    }

    // Submit OTP to Paystack
    const result = await paystack.submitOtp({
      reference,
      otp
    });

    if (result.data.status === "success") {
      const metadata = result.data.metadata || {};
      const { plan, billingCycle } = metadata;
      const amount = result.data.amount / 100;

      await activateSubscription(req.tenant.id, plan, billingCycle, amount, reference, "MTN_MOMO");

      await logActivity({
        tenantId: req.tenant.id,
        action: 'SUBSCRIPTION_UPGRADE',
        metadata: { plan: plan, amount: amount, method: 'MTN_MOMO' },
        req,
      });

      return res.json({
        message: "Payment verified! Subscription activated.",
        success: true
      });
    }

    res.json({
      message: "OTP verification status: " + result.data.status,
      status: result.data.status
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Failed to verify OTP: " + error.message });
  }
});

// ─── VERIFY PAYMENT & ACTIVATE SUBSCRIPTION ────
router.post("/verify", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference required" });
    }

    const verification = await paystack.verifyTransaction(reference);

    if (verification.data.status !== "success") {
      return res.status(400).json({ 
        message: "Payment verification failed", 
        status: verification.data.status 
      });
    }

    const metadata = verification.data.metadata || {};
    const { plan, billingCycle } = metadata;
    const amount = verification.data.amount / 100;

    await activateSubscription(req.tenant.id, plan, billingCycle, amount, reference, "PAYSTACK");

    await logActivity({
      tenantId: req.tenant.id,
      action: 'SUBSCRIPTION_UPGRADE',
      metadata: { plan: plan, amount: amount, method: 'PAYSTACK' },
      req,
    });

    res.json({ message: "Subscription activated successfully!" });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

// ─── CANCEL SUBSCRIPTION ───────────────────────
router.post("/cancel", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: req.tenant.id }
    });

    if (subscription?.paystackSubCode && subscription?.paystackEmailToken) {
      await paystack.disableSubscription({
        code: subscription.paystackSubCode,
        token: subscription.paystackEmailToken
      });
    }

    await prisma.subscription.update({
      where: { tenantId: req.tenant.id },
      data: { status: "CANCELLED" }
    });

    await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: { status: "CANCELLED" }
    });

    res.json({ message: "Subscription cancelled. Access will continue until period end." });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
});

// ─── HELPER: Activate Subscription ─────────────
async function activateSubscription(tenantId, plan, billingCycle, amount, reference, method) {
  const periodEnd = new Date();
  if (billingCycle === "YEARLY") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await prisma.subscription.update({
    where: { tenantId },
    data: {
      plan: plan || "BASIC",
      status: "ACTIVE",
      billingCycle: billingCycle || "MONTHLY",
      priceMonthly: PLANS[plan]?.monthly || 149,
      priceYearly: PLANS[plan]?.yearly || 1520,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd
    }
  });

  await prisma.payment.create({
    data: {
      tenantId,
      amount,
      currency: "GHS",
      status: "SUCCESS",
      method,
      paystackRef: reference,
      description: `Subscription payment - ${plan} (${billingCycle})`
    }
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE" }
  });
}

module.exports = router;
