const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Multi-tenant middleware
 * Extracts tenant from:
 * 1. Subdomain: tenant.yourdomain.com → tenant slug
 * 2. Header: x-tenant-slug
 * 3. Query param: ?tenant=slug (for dev/testing)
 */
const extractTenant = async (req, res, next) => {
  try {
    let tenantSlug = null;

    // 1. Check header (primary for API clients)
    if (req.headers["x-tenant-slug"]) {
      tenantSlug = req.headers["x-tenant-slug"];
    }
    // 2. Check subdomain
    else if (req.headers.host) {
      const host = req.headers.host;
      const parts = host.split(".");
      // If host is like: tenant.wagpos.com → tenant is parts[0]
      // Exclude www and localhost
      if (parts.length > 2 && parts[0] !== "www" && !host.includes("localhost")) {
        tenantSlug = parts[0];
      }
    }
    // 3. Check query param (dev fallback)
    if (!tenantSlug && req.query.tenant) {
      tenantSlug = req.query.tenant;
    }

    if (!tenantSlug) {
      return res.status(400).json({ 
        message: "Tenant identifier required. Provide x-tenant-slug header or use subdomain." 
      });
    }

    // Look up tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
      include: {
        subscription: true,
        settings: true,
        momoConfigs: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check tenant status
    if (tenant.status === "SUSPENDED") {
      return res.status(403).json({ 
        message: "Account suspended. Please contact support.",
        code: "TENANT_SUSPENDED"
      });
    }

    if (tenant.status === "CANCELLED") {
      return res.status(403).json({ 
        message: "Account cancelled. Please renew your subscription.",
        code: "TENANT_CANCELLED"
      });
    }

    // Check trial expiry
    if (tenant.status === "TRIAL" && tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
      return res.status(403).json({ 
        message: "Trial expired. Please subscribe to continue.",
        code: "TRIAL_EXPIRED",
        trialEnded: true
      });
    }

    // Check subscription expiry
    if (tenant.subscription && tenant.subscription.status === "EXPIRED") {
      return res.status(403).json({
        message: "Subscription expired. Please renew.",
        code: "SUBSCRIPTION_EXPIRED"
      });
    }

    // Attach tenant to request
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      businessType: tenant.businessType,
      subscription: tenant.subscription,
      settings: tenant.settings,
      momoConfig: tenant.momoConfigs
    };

    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    res.status(500).json({ message: "Tenant resolution failed" });
  }
};

/**
 * Skip tenant extraction for public routes (signup, health, webhooks)
 */
const skipTenantRoutes = ["/tenants/register", "/tenants/login", "/health", "/webhooks"];

const conditionalTenant = (req, res, next) => {
  if (skipTenantRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  return extractTenant(req, res, next);
};

module.exports = { extractTenant, conditionalTenant };
