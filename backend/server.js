require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { conditionalTenant } = require("./middleware/tenant");
const { handlePaystackWebhook } = require("./services/webhooks");

const prisma = new PrismaClient();
const app = express();

// Database initialization endpoint
app.get('/api/init', async (req, res) => {
  try {
    const existing = await prisma.tenant.findUnique({
      where: { slug: 'demo' }
    });

    if (existing) {
      return res.json({ 
        status: 'already_initialized',
        message: 'Demo data already exists',
        login: { slug: 'demo', pin: '1234' }
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Supermarket',
        slug: 'demo',
        email: 'demo@wagpos.com',
        phone: '+233 20 123 4567',
        businessType: 'SUPERMARKET',
        status: 'ACTIVE',
      }
    });

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'PRO',
        status: 'ACTIVE',
        priceMonthly: 99,
        priceYearly: 999,
        billingCycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.tenantSetting.create({
      data: {
        tenantId: tenant.id,
        shopName: 'Demo Supermarket',
        currency: 'GHS',
        receiptFooter: 'Thank you for shopping with us!',
        lowStockThreshold: 10,
        enableMomo: true,
        enableCard: true
      }
    });

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Admin',
        pin: '1234',
        role: 'ADMIN'
      }
    });

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Cashier',
        pin: '5678',
        role: 'CASHIER'
      }
    });

    res.json({
      status: 'success',
      message: 'Demo data created!',
      login: { slug: 'demo', pin: '1234' }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
// ─── SECURITY MIDDLEWARE ───────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:8080",
  "http://localhost:5173"
];

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-super-admin-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later." }
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later." }
});
app.use("/api/tenants/login", authLimiter);
app.use("/api/tenants/register", authLimiter);

// Raw body parser for webhooks (must be before express.json)
app.use("/webhooks/paystack", express.raw({ type: "application/json" }));
app.post("/webhooks/paystack", handlePaystackWebhook);

// JSON parser for all other routes
app.use(express.json({ limit: "10mb" }));

// ─── HEALTH CHECK ──────────────────────────────
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected", timestamp: new Date().toISOString() });
  }
});

// ─── TENANT MIDDLEWARE ─────────────────────────
app.use("/api", conditionalTenant);

// ─── ROUTES ────────────────────────────────────
app.use("/api/tenants", require("./routes/tenants"));
app.use("/api/products", require("./routes/products"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/momo", require("./routes/momo"));

// ─── SUPER ADMIN ROUTES ────────────────────────
const { router: superAdminRouter } = require("./routes/superAdmin");
app.use("/admin", superAdminRouter);

// ─── ERROR HANDLING ────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS error: Origin not allowed" });
  }
  res.status(500).json({ message: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── START SERVER ──────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 WAG POS API v2.0 running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Super Admin: /admin/* (requires x-super-admin-key header)`);
  console.log(`💳 Paystack Webhook: POST /webhooks/paystack`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});
