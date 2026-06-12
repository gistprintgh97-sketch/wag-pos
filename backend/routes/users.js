const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// Get all users
router.get("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: tenantWhere(req),
      select: {
        id: true,
        name: true,
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

// Create user
router.post("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { name, pin, role } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ message: "Name and PIN are required" });
    }

    if (pin.length < 4) {
      return res.status(400).json({ message: "PIN must be at least 4 digits" });
    }

    if (!["ADMIN", "MANAGER", "CASHIER"].includes(role)) {
      return res.status(400).json({ message: "Role must be ADMIN, MANAGER, or CASHIER" });
    }

    // Check plan limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { subscription: true, _count: { select: { users: true } } }
    });

    const planLimits = {
      STARTER: 2, BASIC: 5, PRO: 15, ENTERPRISE: 50
    };
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
        pin,
        role: role || "CASHIER"
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Create user error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "User with this name already exists" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Update user (toggle active, change role)
router.put("/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const id = parseInt(req.params.id);

    // Can't deactivate yourself
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ message: "Cannot deactivate yourself" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user
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

module.exports = router;
