const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// ─── GET ALL USERS ───
router.get("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: tenantWhere(req),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { name: "asc" }
    });
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ─── CREATE USER ───
router.post("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { name, email, pin, role } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ message: "Name and PIN are required" });
    }

    if (pin.length < 4) {
      return res.status(400).json({ message: "PIN must be at least 4 digits" });
    }

    if (!["ADMIN", "MANAGER", "CASHIER"].includes(role)) {
      return res.status(400).json({ message: "Role must be ADMIN, MANAGER, or CASHIER" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { subscription: true, _count: { select: { users: true } } }
    });

    const planLimits = { STARTER: 2, BASIC: 5, PRO: 15, ENTERPRISE: 50 };
    const maxUsers = planLimits[tenant.subscription?.plan] || 2;

    if (tenant._count.users >= maxUsers) {
      return res.status(403).json({
        message: `User limit reached (${maxUsers}). Upgrade your plan to add more users.`
      });
    }

    const user = await prisma.user.create({
      data: {
        tenantId: req.tenant.id,
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        pin,
        role: role || "CASHIER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Create user error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "User with this name or email already exists" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

// ─── UPDATE USER ───
router.put("/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { role, isActive, email } = req.body;
    const id = parseInt(req.params.id);

    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ message: "Cannot deactivate yourself" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(email !== undefined && { email: email ? email.toLowerCase().trim() : null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});

// ─── DELETE USER ───
router.delete("/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ─── ADMIN/MANAGER RESET STAFF PIN ───
router.post("/reset-pin", extractTenant, protect, async (req, res) => {
  try {
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to reset PINs" });
    }

    const { userId, newPin } = req.body;
    
    if (!userId || !newPin) {
      return res.status(400).json({ message: "userId and newPin are required" });
    }

    if (newPin.length < 4 || newPin.length > 6) {
      return res.status(400).json({ message: "PIN must be 4-6 digits" });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: parseInt(userId), tenantId: req.tenant.id }
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Only ADMIN can reset another ADMIN's PIN" });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ message: "Use profile settings to change your own PIN" });
    }

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { pin: newPin }
    });

    res.json({ message: "PIN reset successfully" });
  } catch (error) {
    console.error("Reset PIN error:", error);
    res.status(500).json({ message: "Failed to reset PIN" });
  }
});

// ─── FORGOT PIN: Request reset code ───
router.post("/forgot-pin", extractTenant, async (req, res) => {
  try {
    const { email, shopSlug } = req.body;
    
    if (!email || !shopSlug) {
      return res.status(400).json({ message: "Email and shop slug are required" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: shopSlug.toLowerCase().trim() }
    });

    if (!tenant) {
      return res.json({ message: "If this email exists, a reset code has been sent" });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase().trim(),
        tenantId: tenant.id
      }
    });

    if (!user) {
      return res.json({ message: "If this email exists, a reset code has been sent" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken: resetCode,
        resetTokenExpiry: expiry
      }
    });

    // TODO: Integrate SendGrid/EmailJS here to email the code
    // For testing only — remove debugCode in production
    res.json({ 
      message: "Reset code sent to your email",
      debugCode: resetCode 
    });
  } catch (error) {
    console.error("Forgot PIN error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// ─── VERIFY RESET CODE ───
router.post("/verify-reset-code", extractTenant, async (req, res) => {
  try {
    const { email, code, shopSlug } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: shopSlug.toLowerCase().trim() }
    });

    if (!tenant) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        tenantId: tenant.id,
        resetToken: code,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ valid: true, userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
});

// ─── CONFIRM NEW PIN ───
router.post("/confirm-reset-pin", extractTenant, async (req, res) => {
  try {
    const { userId, code, newPin, shopSlug } = req.body;

    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      return res.status(400).json({ message: "PIN must be 4-6 digits" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: shopSlug.toLowerCase().trim() }
    });

    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        tenantId: tenant.id,
        resetToken: code,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin: newPin,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: "PIN updated successfully. You can now log in." });
  } catch (error) {
    console.error("Confirm reset error:", error);
    res.status(500).json({ message: "Failed to update PIN" });
  }
});

module.exports = router;