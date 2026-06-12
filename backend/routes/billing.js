const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const paystack = require("../services/paystack");
const prisma = new PrismaClient();

const PLANS = {
  STARTER: { monthly: 0, yearly: 0, maxUsers: 2, maxProducts: 100 },
  BASIC:   { monthly: 49, yearly: 499, maxUsers: 5, maxProducts: 500 },
  PRO:     { monthly: 99, yearly: 999, maxUsers: 15, maxProducts: 2000 },
  ENTERPRISE: { monthly: 249, yearly: 2499, maxUsers: 50, maxProducts: 10000 }
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
      // Free plan - just update subscription
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

      return res.json({ message: "Subscribed to free plan successfully" });
    }

    // Initialize Paystack transaction
    const transaction = await paystack.initializeTransaction({
      email: tenant.email,
      amount,
      metadata: {
        tenantId: tenant.id,
        plan,
        billingCycle,
        type: "subscription"
      }
    });

    res.json({
      message: "Payment initiated",
      authorizationUrl: transaction.data.authorization_url,
      reference: transaction.data.reference
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ message: "Failed to initiate subscription" });
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

    const periodEnd = new Date();
    if (billingCycle === "YEARLY") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update subscription
    await prisma.subscription.update({
      where: { tenantId: req.tenant.id },
      data: {
        plan: plan || "BASIC",
        status: "ACTIVE",
        billingCycle: billingCycle || "MONTHLY",
        priceMonthly: PLANS[plan]?.monthly || 49,
        priceYearly: PLANS[plan]?.yearly || 499,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd
      }
    });

    // Record payment
    await prisma.payment.create({
      data: {
        tenantId: req.tenant.id,
        amount: verification.data.amount / 100,
        currency: verification.data.currency || "GHS",
        status: "SUCCESS",
        method: "PAYSTACK",
        paystackRef: reference,
        description: `Subscription payment - ${plan} (${billingCycle})`
      }
    });

    // Activate tenant
    await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: { status: "ACTIVE" }
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

module.exports = router;
