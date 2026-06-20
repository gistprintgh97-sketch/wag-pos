const { validate, loginRules, registerRules } = require('../middleware/validation');
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

// ─── PLANS & PRICING ───────────────────────────
const PLANS = {
  STARTER: { monthly: 0, yearly: 0, maxUsers: 2, maxProducts: 100, features: ["basic_pos", "reports"] },
  BASIC:   { monthly: 49, yearly: 499, maxUsers: 5, maxProducts: 500, features: ["basic_pos", "reports", "momo"] },
  PRO:     { monthly: 99, yearly: 999, maxUsers: 15, maxProducts: 2000, features: ["all"] },
  ENTERPRISE: { monthly: 249, yearly: 2499, maxUsers: 50, maxProducts: 10000, features: ["all", "api_access", "priority_support"] }
};

const TRIAL_DAYS = 14;

// ─── REGISTER NEW TENANT ───────────────────────
router.post("/register", registerRules, validate, async (req, res) => {
  try {
    const { name, slug, email, phone, businessType, adminName, adminPin, plan = "STARTER" } = req.body;

    // Validation
    if (!name || !slug || !email || !adminName || !adminPin) {
      return res.status(400).json({ message: "Name, slug, email, admin name and PIN are required" });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ message: "Slug must be lowercase letters, numbers, and hyphens only" });
    }

    if (adminPin.length < 4) {
      return res.status(400).json({ message: "Admin PIN must be at least 4 digits" });
    }

    // Check if slug exists
    const existing = await prisma.tenant.findUnique({ where: { slug: slug.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: "This shop URL is already taken. Try a different name." });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    // Create tenant with admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: name.trim(),
          slug: slug.toLowerCase().trim(),
          email: email.trim(),
          phone: phone?.trim(),
          businessType: businessType || "SUPERMARKET",
          status: "TRIAL",
          trialEndsAt,
          subscription: {
            create: {
              plan,
              status: "TRIAL",
              priceMonthly: PLANS[plan]?.monthly || 0,
              priceYearly: PLANS[plan]?.yearly || 0,
              currentPeriodStart: new Date(),
              currentPeriodEnd: trialEndsAt
            }
          },
          settings: {
            create: {
              shopName: name.trim(),
              currency: "GHS",
              receiptFooter: `Thank you for shopping at ${name.trim()}!`,
              lowStockThreshold: 10
            }
          }
        }
      });

      // Create admin user
      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: adminName.trim(),
          pin: adminPin,
          role: "ADMIN"
        }
      });

      return { tenant, admin };
    });

    // Generate token
    const token = jwt.sign(
      { id: result.admin.id, name: result.admin.name, role: result.admin.role, tenantId: result.tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Tenant registered successfully!",
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        status: result.tenant.status,
        trialEndsAt: result.tenant.trialEndsAt
      },
      user: {
        id: result.admin.id,
        name: result.admin.name,
        role: result.admin.role
      },
      token
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ─── TENANT LOGIN ──────────────────────────────
router.post("/login", loginRules, validate, async (req, res) => {
  try {
    const { slug, pin } = req.body;

    if (!slug || !pin) {
      return res.status(400).json({ message: "Shop slug and PIN are required" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { subscription: true }
    });

    if (!tenant) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check tenant status
    if (tenant.status === "SUSPENDED") {
      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

    if (tenant.status === "CANCELLED") {
      return res.status(403).json({ message: "Account cancelled. Please renew." });
    }

    // Find user by PIN within tenant
    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, pin }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account deactivated" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, tenantId: tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
        subscription: tenant.subscription
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ─── GET CURRENT TENANT INFO ───────────────────
router.get("/me", extractTenant, protect, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: {
        subscription: true,
        settings: true,
        _count: {
          select: { users: true, products: true }
        }
      }
    });

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const plan = PLANS[tenant.subscription?.plan] || PLANS.STARTER;

    res.json({
      ...tenant,
      limits: {
        maxUsers: plan.maxUsers,
        maxProducts: plan.maxProducts,
        currentUsers: tenant._count.users,
        currentProducts: tenant._count.products
      }
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

// ─── UPDATE TENANT PROFILE ─────────────────────
router.put("/me", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, address, logoUrl, businessType } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() }),
        ...(address !== undefined && { address }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(businessType && { businessType })
      }
    });

    res.json({ message: "Profile updated", tenant });
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ─── GET PLANS ─────────────────────────────────
router.get("/plans", async (req, res) => {
  res.json(PLANS);
});

module.exports = router;
