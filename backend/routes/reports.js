const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// Helper: get date range
const getDateRange = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
};

// ─── MAIN DASHBOARD ─────────────────────────────────────────
router.get("/dashboard", extractTenant, protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries
    const [
      todayAgg,
      yesterdayAgg,
      weekAgg,
      monthAgg,
      allTimeAgg,
      productsCount,
      usersCount,
      lowStockCount,
      recentSales,
      lowStockProducts,
      salesByDay,
      salesByPayment,
      topProducts,
      hourlySales
    ] = await Promise.all([
      // Today
      prisma.sale.aggregate({
        where: tenantWhere(req, { createdAt: { gte: startOfDay, lte: endOfDay } }),
        _sum: { total: true }, _count: { id: true }
      }),
      // Yesterday
      prisma.sale.aggregate({
        where: tenantWhere(req, {
          createdAt: {
            gte: new Date(startOfDay.getTime() - 86400000),
            lt: startOfDay
          }
        }),
        _sum: { total: true }, _count: { id: true }
      }),
      // This week
      prisma.sale.aggregate({
        where: tenantWhere(req, { createdAt: { gte: startOfWeek } }),
        _sum: { total: true }, _count: { id: true }
      }),
      // This month
      prisma.sale.aggregate({
        where: tenantWhere(req, { createdAt: { gte: startOfMonth } }),
        _sum: { total: true }, _count: { id: true }
      }),
      // All time
      prisma.sale.aggregate({
        where: tenantWhere(req),
        _sum: { total: true }, _count: { id: true }
      }),
      // Products
      prisma.product.count({ where: tenantWhere(req, { deleted: false }) }),
      // Users
      prisma.user.count({ where: tenantWhere(req, { isActive: true }) }),
      // Low stock count
      prisma.product.count({ where: tenantWhere(req, { deleted: false, stock: { lte: 10 } }) }),
      // Recent sales
      prisma.sale.findMany({
        where: tenantWhere(req),
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: { select: { name: true } } } },
          cashier: { select: { name: true } }
        }
      }),
      // Low stock products
      prisma.product.findMany({
        where: tenantWhere(req, { deleted: false, stock: { lte: 10 } }),
        orderBy: { stock: "asc" },
        take: 5
      }),
      // Sales by day (last 7 days)
      Promise.all(
        getDateRange(7).map(async (date) => {
          const nextDay = new Date(date.getTime() + 86400000);
          const agg = await prisma.sale.aggregate({
            where: tenantWhere(req, {
              createdAt: { gte: date, lt: nextDay }
            }),
            _sum: { total: true },
            _count: { id: true }
          });
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            fullDate: date.toISOString().split('T')[0],
            revenue: agg._sum.total || 0,
            sales: agg._count.id || 0
          };
        })
      ),
      // Sales by payment method
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: tenantWhere(req, { createdAt: { gte: startOfMonth } }),
        _sum: { total: true },
        _count: { id: true }
      }),
      // Top selling products this month
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: { tenantId: req.tenant.id, createdAt: { gte: startOfMonth } }
        },
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }).then(async (items) => {
        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        });
        return items.map(item => ({
          name: products.find(p => p.id === item.productId)?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
          revenue: (item._sum.price || 0) * (item._sum.quantity || 0)
        }));
      }),
      // Hourly sales today
      Promise.all(
        Array.from({ length: 24 }, (_, hour) => hour).map(async (hour) => {
          const hourStart = new Date(startOfDay);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(startOfDay);
          hourEnd.setHours(hour, 59, 59, 999);
          const agg = await prisma.sale.aggregate({
            where: tenantWhere(req, {
              createdAt: { gte: hourStart, lte: hourEnd }
            }),
            _sum: { total: true },
            _count: { id: true }
          });
          return {
            hour: `${hour.toString().padStart(2, '0')}:00`,
            revenue: agg._sum.total || 0,
            sales: agg._count.id || 0
          };
        })
      )
    ]);

    // Calculate trends
    const todayRevenue = todayAgg._sum.total || 0;
    const yesterdayRevenue = yesterdayAgg._sum.total || 0;
    const revenueTrend = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : todayRevenue > 0 ? 100 : 0;

    const todaySalesCount = todayAgg._count.id || 0;
    const yesterdaySalesCount = yesterdayAgg._count.id || 0;
    const salesTrend = yesterdaySalesCount > 0
      ? ((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount * 100).toFixed(1)
      : todaySalesCount > 0 ? 100 : 0;

    res.json({
      // KPI Cards
      todaySales: todayRevenue,
      todaySalesCount,
      totalSales: allTimeAgg._count.id || 0,
      totalRevenue: allTimeAgg._sum.total || 0,
      weekRevenue: weekAgg._sum.total || 0,
      monthRevenue: monthAgg._sum.total || 0,
      totalProducts: productsCount,
      totalUsers: usersCount,
      lowStockCount,

      // Trends
      revenueTrend: parseFloat(revenueTrend),
      salesTrend: parseFloat(salesTrend),

      // Chart Data
      salesByDay,
      salesByPayment: salesByPayment.map(p => ({
        name: p.paymentMethod || 'Cash',
        value: p._sum.total || 0,
        count: p._count.id || 0
      })),
      topProducts,
      hourlySales: hourlySales.filter(h => h.sales > 0 || parseInt(h.hour) <= now.getHours()),

      // Lists
      recentSales: recentSales.map(s => ({
        id: s.id,
        receiptNumber: `#${String(s.id).padStart(6, '0')}`,
        cashier: s.cashier,
        items: s.items.length,
        paymentMethod: s.paymentMethod || 'Cash',
        amount: s.total,
        createdAt: s.createdAt
      })),
      lowStock: lowStockProducts
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to generate dashboard report" });
  }
});

// ─── LOW STOCK ───
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