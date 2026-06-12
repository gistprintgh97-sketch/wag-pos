const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// Create sale (transaction-safe)
router.post("/", extractTenant, protect, async (req, res) => {
  try {
    const { items, paymentMethod, momoPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method required" });
    }

    // Validate payment method against tenant settings
    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });

    if (paymentMethod === "Mobile Money" && !settings?.enableMomo) {
      return res.status(400).json({ message: "Mobile Money is not enabled for this shop" });
    }

    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const saleItems = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId: req.tenant.id }
        });

        if (!product || product.deleted) {
          throw new Error(`Product ${item.name} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        total += product.price * item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      }

      const sale = await tx.sale.create({
        data: {
          tenantId: req.tenant.id,
          total,
          paymentMethod,
          momoPhone: momoPhone || null,
          momoStatus: paymentMethod === "Mobile Money" ? "PENDING" : null,
          cashierId: req.user.id,
          items: { create: saleItems }
        },
        include: {
          items: { include: { product: true } },
          cashier: { select: { name: true } }
        }
      });

      return sale;
    });

    res.status(201).json({
      message: "Sale completed successfully",
      sale: result
    });
  } catch (error) {
    console.error("Sale error:", error);
    if (error.message.includes("Insufficient stock") || error.message.includes("not found")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to complete sale" });
  }
});

// Get sales history
router.get("/", extractTenant, protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = tenantWhere(req);
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [sales, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true } } }
          },
          cashier: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit)
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

// Get single sale
router.get("/:id", extractTenant, protect, async (req, res) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: tenantWhere(req, { id: parseInt(req.params.id) }),
      include: {
        items: { include: { product: true } },
        cashier: { select: { name: true } }
      }
    });

    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sale" });
  }
});

// Get daily sales summary
router.get("/summary/daily", extractTenant, protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await prisma.sale.findMany({
      where: tenantWhere(req, {
        createdAt: { gte: today, lt: tomorrow }
      }),
      include: {
        items: { include: { product: true } }
      }
    });

    const totalSales = sales.length;
    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const profit = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const cost = item.product.costPrice * item.quantity;
        return itemSum + (item.price * item.quantity - cost);
      }, 0);
    }, 0);

    // Payment method breakdown
    const byMethod = {};
    sales.forEach(s => {
      byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.total;
    });

    res.json({ totalSales, revenue, profit, byMethod });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch daily summary" });
  }
});

module.exports = router;
