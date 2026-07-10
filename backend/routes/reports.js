const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// ─── NEW: Dashboard endpoint that matches frontend expectations ───
router.get("/dashboard", extractTenant, protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      todayAgg,
      allTimeAgg,
      productsCount,
      usersCount,
      recentSales,
      lowStockProducts
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: tenantWhere(req, { createdAt: { gte: startOfDay, lte: endOfDay } }),
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.sale.aggregate({
        where: tenantWhere(req),
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.product.count({ where: tenantWhere(req, { deleted: false }) }),
      prisma.user.count({ where: tenantWhere(req, { isActive: true }) }),
      prisma.sale.findMany({
        where: tenantWhere(req),
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: { select: { name: true } } } },
          cashier: { select: { name: true } }
        }
      }),
      prisma.product.findMany({
        where: tenantWhere(req, { deleted: false, stock: { lte: 10 } }),
        orderBy: { stock: "asc" },
        take: 5
      })
    ]);

    res.json({
      todaySales: todayAgg._sum.total || 0,
      todaySalesCount: todayAgg._count.id || 0,
      totalSales: allTimeAgg._count.id || 0,
      totalProducts: productsCount,
      totalUsers: usersCount,
      recentSales: recentSales.map(s => ({
        id: s.id,
        cashier: s.cashier,
        items: s.items,
        total: s.total,
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt
      })),
      lowStock: lowStockProducts
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to generate dashboard report" });
  }
});

// ─── LEGACY: Keep old endpoint for backward compatibility ───
router.get("/", extractTenant, protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await prisma.sale.findMany({
      where: tenantWhere(req, { createdAt: { gte: today, lt: tomorrow } }),
      include: { items: { include: { product: true } } }
    });

    const totalSales = todaySales.length;
    const revenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const profit = todaySales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const cost = item.product.costPrice * item.quantity;
        return itemSum + (item.price * item.quantity - cost);
      }, 0);
    }, 0);

    const allSales = await prisma.sale.findMany({
      where: tenantWhere(req),
      include: { items: { include: { product: true } } }
    });

    const allTimeRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
    const allTimeProfit = allSales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        const cost = item.product.costPrice * item.quantity;
        return itemSum + (item.price * item.quantity - cost);
      }, 0);
    }, 0);

    const productSales = {};
    allSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });
    const threshold = settings?.lowStockThreshold || 10;

    const lowStock = await prisma.product.findMany({
      where: tenantWhere(req, { deleted: false, stock: { lte: threshold } }),
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

// ─── GET SALES BY DATE RANGE ───
router.get("/range", extractTenant, protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const sales = await prisma.sale.findMany({
      where: tenantWhere(req, {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
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

// ─── LOW STOCK (convenience endpoint) ───
router.get("/low-stock", extractTenant, protect, async (req, res) => {
  try {
    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });
    const threshold = settings?.lowStockThreshold || 10;

    const products = await prisma.product.findMany({
      where: tenantWhere(req, { deleted: false, stock: { lte: threshold } }),
      orderBy: { stock: "asc" }
    });

    res.json(products);
  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({ message: "Failed to fetch low stock products" });
  }
});

module.exports = router;