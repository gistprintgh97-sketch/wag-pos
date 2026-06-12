const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Super Admin Middleware
 * Protects routes that manage the entire SaaS platform
 */
const superAdminOnly = (req, res, next) => {
  const superKey = req.headers["x-super-admin-key"];
  if (superKey !== process.env.SUPER_ADMIN_KEY) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
};

// ─── GET ALL TENANTS ───────────────────────────
router.get("/tenants", superAdminOnly, async (req, res) => {
  try {
    const { status, plan, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (plan) where.subscription = { plan };

    const [tenants, total] = await prisma.$transaction([
      prisma.tenant.findMany({
        where,
        include: {
          subscription: true,
          _count: { select: { users: true, products: true, sales: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit)
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Super admin tenants error:", error);
    res.status(500).json({ message: "Failed to fetch tenants" });
  }
});

// ─── GET TENANT DETAILS ────────────────────────
router.get("/tenants/:id", superAdminOnly, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: true,
        settings: true,
        users: { select: { id: true, name: true, role: true, isActive: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { products: true, sales: true } }
      }
    });

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

// ─── UPDATE TENANT STATUS ──────────────────────
router.put("/tenants/:id/status", superAdminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json({ message: "Tenant status updated", tenant });
  } catch (error) {
    res.status(500).json({ message: "Failed to update tenant status" });
  }
});

// ─── GET PLATFORM STATS ────────────────────────
router.get("/stats", superAdminOnly, async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      totalRevenue,
      totalSales,
      totalProducts
    ] = await prisma.$transaction([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "TRIAL" } }),
      prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
      prisma.sale.count(),
      prisma.product.count({ where: { deleted: false } })
    ]);

    res.json({
      totalTenants,
      activeTenants,
      trialTenants,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalSales,
      totalProducts
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// ─── GET RECENT PAYMENTS ───────────────────────
router.get("/payments", superAdminOnly, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { tenant: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

module.exports = { router, superAdminOnly };
