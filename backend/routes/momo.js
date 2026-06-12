const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const MomoService = require("../services/momo");
const prisma = new PrismaClient();

// ─── INITIATE MoMo PAYMENT FOR SALE ────────────
router.post("/pay", extractTenant, protect, async (req, res) => {
  try {
    const { phone, amount, saleId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone number and amount required" });
    }

    // Check if MoMo is enabled for this tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { momoConfigs: true, settings: true }
    });

    if (!tenant.settings?.enableMomo) {
      return res.status(403).json({ message: "Mobile Money payments are not enabled for this shop" });
    }

    if (!tenant.momoConfigs || !tenant.momoConfigs.isActive) {
      return res.status(403).json({ message: "MoMo configuration incomplete. Contact admin." });
    }

    const momo = new MomoService({
      environment: tenant.momoConfigs.environment,
      apiUser: tenant.momoConfigs.apiUser,
      apiKey: tenant.momoConfigs.apiKey,
      subscriptionKey: tenant.momoConfigs.subscriptionKey,
      targetEnvironment: tenant.momoConfigs.targetEnvironment,
      currency: tenant.momoConfigs.currency
    });

    const result = await momo.requestToPay({
      phone,
      amount,
      currency: tenant.momoConfigs.currency,
      externalId: saleId ? `sale-${saleId}` : undefined,
      payerMessage: `Payment to ${tenant.name}`,
      payeeNote: `WAG POS Sale #${saleId || 'N/A'}`
    });

    // If saleId provided, update sale with MoMo reference
    if (saleId) {
      await prisma.sale.update({
        where: { id: parseInt(saleId) },
        data: {
          momoPhone: phone,
          momoStatus: "PENDING",
          momoTransId: result.referenceId
        }
      });
    }

    res.json({
      success: true,
      referenceId: result.referenceId,
      message: result.message,
      instructions: `A payment request has been sent to ${phone}. Please approve it on your phone.`
    });
  } catch (error) {
    console.error("MoMo pay error:", error);
    res.status(500).json({ message: error.message || "Failed to initiate MoMo payment" });
  }
});

// ─── CHECK MoMo PAYMENT STATUS ─────────────────
router.get("/status/:referenceId", extractTenant, protect, async (req, res) => {
  try {
    const { referenceId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { momoConfigs: true }
    });

    if (!tenant.momoConfigs) {
      return res.status(403).json({ message: "MoMo not configured" });
    }

    const momo = new MomoService({
      environment: tenant.momoConfigs.environment,
      apiUser: tenant.momoConfigs.apiUser,
      apiKey: tenant.momoConfigs.apiKey,
      subscriptionKey: tenant.momoConfigs.subscriptionKey,
      targetEnvironment: tenant.momoConfigs.targetEnvironment
    });

    const status = await momo.getPaymentStatus(referenceId);

    // Update sale if linked
    const sale = await prisma.sale.findFirst({
      where: { momoTransId: referenceId }
    });

    if (sale) {
      const momoStatus = status.status === "SUCCESSFUL" ? "SUCCESS" : 
                         status.status === "FAILED" ? "FAILED" : "PENDING";

      await prisma.sale.update({
        where: { id: sale.id },
        data: { momoStatus }
      });
    }

    res.json({
      status: status.status, // PENDING, SUCCESSFUL, FAILED
      amount: status.amount,
      currency: status.currency,
      financialTransactionId: status.financialTransactionId,
      reason: status.reason
    });
  } catch (error) {
    console.error("MoMo status error:", error);
    res.status(500).json({ message: "Failed to check payment status" });
  }
});

// ─── CONFIGURE MoMo FOR TENANT (Admin) ─────────
router.post("/config", extractTenant, protect, async (req, res) => {
  try {
    // Only admin can configure MoMo
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { environment, apiUser, apiKey, subscriptionKey, callbackUrl } = req.body;

    if (!subscriptionKey) {
      return res.status(400).json({ message: "Subscription key is required" });
    }

    const config = await prisma.momoConfig.upsert({
      where: { tenantId: req.tenant.id },
      update: {
        environment: environment || "SANDBOX",
        apiUser: apiUser || null,
        apiKey: apiKey || null,
        subscriptionKey,
        callbackUrl: callbackUrl || null,
        targetEnvironment: environment === "PRODUCTION" ? "mtnghana" : "sandbox",
        currency: environment === "PRODUCTION" ? "GHS" : "EUR",
        isActive: true
      },
      create: {
        tenantId: req.tenant.id,
        environment: environment || "SANDBOX",
        apiUser: apiUser || null,
        apiKey: apiKey || null,
        subscriptionKey,
        callbackUrl: callbackUrl || null,
        targetEnvironment: environment === "PRODUCTION" ? "mtnghana" : "sandbox",
        currency: environment === "PRODUCTION" ? "GHS" : "EUR",
        isActive: true
      }
    });

    // Enable MoMo in settings
    await prisma.tenantSetting.update({
      where: { tenantId: req.tenant.id },
      data: { enableMomo: true }
    });

    res.json({ message: "MoMo configured successfully", config: { ...config, apiKey: undefined } });
  } catch (error) {
    console.error("MoMo config error:", error);
    res.status(500).json({ message: "Failed to configure MoMo" });
  }
});

// ─── GET MoMo CONFIG ───────────────────────────
router.get("/config", extractTenant, protect, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const config = await prisma.momoConfig.findUnique({
      where: { tenantId: req.tenant.id }
    });

    if (!config) {
      return res.json({ configured: false });
    }

    res.json({
      configured: true,
      environment: config.environment,
      isActive: config.isActive,
      currency: config.currency,
      targetEnvironment: config.targetEnvironment,
      // Never return apiKey
      hasApiUser: !!config.apiUser,
      hasApiKey: !!config.apiKey,
      hasSubscriptionKey: !!config.subscriptionKey
    });
  } catch (error) {
    console.error("Get MoMo config error:", error);
    res.status(500).json({ message: "Failed to fetch MoMo config" });
  }
});

module.exports = router;
