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

app.post("/api/tenants/init-demo", async (req, res) => {
  try {
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'demo' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          slug: 'demo',
          name: 'Demo Supermarket'
        }
      });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id }
    });

    if (!existingSubscription) {
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
    }

    const existingSettings = await prisma.tenantSetting.findFirst({
      where: { tenantId: tenant.id }
    });

    if (!existingSettings) {
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
    }

    const existingUsers = await prisma.user.findMany({
      where: { tenantId: tenant.id }
    });

    if (existingUsers.length === 0) {
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

      const products = [
        { name: 'Coca Cola', price: 5.00, costPrice: 3.50, stock: 50, category: 'Beverages' },
        { name: 'Pepsi', price: 4.50, costPrice: 3.00, stock: 45, category: 'Beverages' },
        { name: 'Bottle Water', price: 2.00, costPrice: 1.00, stock: 100, category: 'Beverages' },
        { name: 'Bread', price: 8.00, costPrice: 5.00, stock: 20, category: 'Bakery' },
        { name: 'Sugar (1kg)', price: 15.00, costPrice: 12.00, stock: 30, category: 'Groceries' },
        { name: 'Rice (5kg)', price: 45.00, costPrice: 38.00, stock: 25, category: 'Groceries' },
        { name: 'Cooking Oil (1L)', price: 18.00, costPrice: 15.00, stock: 40, category: 'Groceries' },
        { name: 'Soap', price: 6.00, costPrice: 4.00, stock: 60, category: 'Household' },
        { name: 'Toothpaste', price: 12.00, costPrice: 9.00, stock: 35, category: 'Personal Care' },
        { name: 'Milo (Nestle)', price: 25.00, costPrice: 20.00, stock: 15, category: 'Beverages' },
        { name: 'Milk (1L)', price: 10.00, costPrice: 8.00, stock: 8, category: 'Dairy' },
        { name: 'Eggs (crate)', price: 35.00, costPrice: 30.00, stock: 12, category: 'Dairy' }
      ];

      for (const p of products) {
        await prisma.product.create({
          data: { tenantId: tenant.id, ...p }
        });
      }

      res.json({
        status: 'success',
        message: 'Demo users and products created!',
        login: { slug: 'demo', pin: '1234' }
      });
    } else {
      res.json({
        status: 'already_initialized',
        message: 'Demo data already exists',
        login: { slug: 'demo', pin: '1234' }
      });
    }
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
// ─── SECURITY MIDDLEWARE ───────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// CORS
const allowedOrigins = [
  "https://wag-pos-web.onrender.com",
  // Add your custom domain later:
  // "https://app.wagpos.com.gh",
  // "https://www.wagpos.com.gh"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("Not allowed by CORS"));
    }
    return callback(null, true);
  },
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
// Request logging for security monitoring
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  console.log(`[SECURITY] ${timestamp} | ${req.method} ${req.path} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`);
  next();
});
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
