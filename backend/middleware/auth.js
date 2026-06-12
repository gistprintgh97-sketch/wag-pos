const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Protect route - verifies JWT and attaches user with tenant context
 * Requires tenant to be resolved first (use after tenant middleware)
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user belongs to the current tenant
    if (req.tenant && decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({ message: "User does not belong to this tenant" });
    }

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, role: true, tenantId: true, isActive: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const managerOrAdmin = (req, res, next) => {
  if (!["ADMIN", "MANAGER"].includes(req.user.role)) {
    return res.status(403).json({ message: "Manager or Admin access required" });
  }
  next();
};

module.exports = { protect, adminOnly, managerOrAdmin };
