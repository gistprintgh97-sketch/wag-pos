const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get settings
router.get("/", extractTenant, protect, async (req, res) => {
  try {
    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });

    if (!settings) {
      // Create default settings if missing
      const newSettings = await prisma.tenantSetting.create({
        data: {
          tenantId: req.tenant.id,
          shopName: req.tenant.name
        }
      });
      return res.json(newSettings);
    }

    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update settings (Admin only)
router.put("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const {
      shopName,
      currency,
      receiptFooter,
      receiptHeader,
      taxRate,
      lowStockThreshold,
      enableMomo,
      enableCard,
      enableCreditSales
    } = req.body;

    const settings = await prisma.tenantSetting.upsert({
      where: { tenantId: req.tenant.id },
      update: {
        ...(shopName !== undefined && { shopName: shopName.trim() }),
        ...(currency !== undefined && { currency }),
        ...(receiptFooter !== undefined && { receiptFooter }),
        ...(receiptHeader !== undefined && { receiptHeader }),
        ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) || 0 }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) || 10 }),
        ...(enableMomo !== undefined && { enableMomo: !!enableMomo }),
        ...(enableCard !== undefined && { enableCard: !!enableCard }),
        ...(enableCreditSales !== undefined && { enableCreditSales: !!enableCreditSales })
      },
      create: {
        tenantId: req.tenant.id,
        shopName: shopName?.trim() || req.tenant.name,
        currency: currency || "GHS",
        receiptFooter: receiptFooter || "Thank you for your purchase!",
        receiptHeader: receiptHeader || null,
        taxRate: parseFloat(taxRate) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        enableMomo: !!enableMomo,
        enableCard: !!enableCard,
        enableCreditSales: !!enableCreditSales
      }
    });

    res.json({ message: "Settings updated", settings });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
