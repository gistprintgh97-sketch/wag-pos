const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// Get dashboard report
router.get("/", extractTenant, protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's stats
    const todaySales = await prisma.sale.findMany({
      where: tenantWhere(req, {
        createdAt: { gte: today, lt: tomorrow }
      }),
      include: {
        items: { include: { product: true } }
      }
    });

    const totalSales = todaySales.length;
    const revenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const profit = todaySales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const cost = item.product.costPrice * item.quantity;
        return itemSum + (item.price * item.quantity - cost);
      }, 0);
    }, 0);

    // All-time stats
    const allSales = await prisma.sale.findMany({
      where: tenantWhere(req),
      include: {
        items: { include: { product: true } }
      }
    });

    const allTimeRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
    const allTimeProfit = allSales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const cost = item.product.costPrice * item.quantity;
        return itemSum + (item.price * item.quantity - cost);
      }, 0);
    }, 0);

    // Top selling products
    const productSales = {};
    allSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Low stock
    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });
    const threshold = settings?.lowStockThreshold || 10;

    const lowStock = await prisma.product.findMany({
      where: tenantWhere(req, {
        deleted: false,
        stock: { lte: threshold }
      }),
      orderBy: { stock: "asc" }
    });

    res.json({
      today: { totalSales, revenue, profit },
      allTime: { totalSales: allSales.length, revenue: allTimeRevenue, profit: allTimeProfit },
      topProducts,
      lowStock
    });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// Get sales by date range
router.get("/range", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const sales = await prisma.sale.findMany({
      where: tenantWhere(req, {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      include: {
        items: { include: { product: true } },
        cashier: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const summary = {
      totalSales: sales.length,
      revenue: sales.reduce((sum, s) => sum + s.total, 0),
      byPaymentMethod: {}
    };

    sales.forEach(sale => {
      if (!summary.byPaymentMethod[sale.paymentMethod]) {
        summary.byPaymentMethod[sale.paymentMethod] = { count: 0, amount: 0 };
      }
      summary.byPaymentMethod[sale.paymentMethod].count++;
      summary.byPaymentMethod[sale.paymentMethod].amount += sale.total;
    });

    res.json({ sales, summary });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch range report" });
  }
});

module.exports = router;
