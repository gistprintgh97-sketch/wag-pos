const { validate, registerRules } = require('../middleware/validation');
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();
const { logActivity } = require('../services/activityLogger');

// ─── PLANS & PRICING ───────────────────────────
const PLANS = {
  STARTER: { monthly: 0, yearly: 0, maxUsers: 1, maxProducts: 200, features: ["basic_pos", "reports", "momo"] },
  BASIC:   { monthly: 149, yearly: 1520, maxUsers: 3, maxProducts: 1000, features: ["basic_pos", "reports", "momo", "advanced_reports"] },
  PRO:     { monthly: 349, yearly: 3560, maxUsers: 8, maxProducts: 5000, features: ["all", "offline_mode"] },
  ENTERPRISE: { monthly: 799, yearly: 8150, maxUsers: 999999, maxProducts: 999999, features: ["all", "api_access", "priority_support", "multi_branch"] }
};

const TRIAL_DAYS = 14;

// ─── REGISTER NEW TENANT ───────────────────────
router.post("/register", registerRules, validate, async (req, res) => {
  try {
    const { name, slug, email, phone, businessType, adminName, adminPin, plan = "STARTER" } = req.body;

    if (!name || !slug || !email || !adminName || !adminPin) {
      return res.status(400).json({ message: "Name, slug, email, admin name and PIN are required" });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ message: "Slug must be lowercase letters, numbers, and hyphens only" });
    }

    if (adminPin.length < 4) {
      return res.status(400).json({ message: "Admin PIN must be at least 4 digits" });
    }

    const existing = await prisma.tenant.findUnique({ where: { slug: slug.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: "This shop URL is already taken. Try a different name." });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    // Create tenant + admin in one transaction
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

    // LOG ACTIVITY — AFTER the transaction succeeds, OUTSIDE of it
    await logActivity({
      tenantId: result.tenant.id,
      action: 'TENANT_REGISTERED',
      metadata: { 
        shopName: result.tenant.name, 
        plan: plan,  // Use the plan variable from req.body, not tenant.plan
        businessType: result.tenant.businessType 
      },
      req,
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
router.post("/login", async (req, res) => {
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

    if (tenant.status === "SUSPENDED") {
      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

        if (tenant.status === "CANCELLED") {
      // Allow login but flag as cancelled — frontend will redirect to billing
      const token = jwt.sign(
        { id: user.id, name: user.name, role: user.role, tenantId: tenant.id, status: "CANCELLED" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      await logActivity({
        tenantId: tenant.id,
        userId: user.id,
        action: 'USER_LOGIN_CANCELLED',
        metadata: { role: user.role, name: user.name },
        req,
      });

      return res.json({
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
        token,
        cancelled: true,
        message: "Your subscription has been cancelled. Please renew to continue."
      });
    }

    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, pin }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account deactivated" });
    }

    // LOG ACTIVITY — someone just logged in
    await logActivity({
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_LOGIN',
      metadata: { role: user.role, name: user.name },
      req,
    });

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
