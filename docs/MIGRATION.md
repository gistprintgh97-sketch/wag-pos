# Migration Guide: Single-Tenant to Multi-Tenant

## Overview
This guide helps you migrate your existing WAG POS single-tenant database to the new multi-tenant architecture.

## Prerequisites
- Backup your existing database
- Node.js 18+ installed
- Prisma CLI installed

## Step 1: Backup Your Data

```bash
# Create backup
pg_dump -h localhost -U postgres -d ghana_pos > backup_$(date +%Y%m%d).sql
```

## Step 2: Update Schema

Replace your old `schema.prisma` with the new multi-tenant schema from this repo.

## Step 3: Create Migration

```bash
cd backend
npx prisma migrate dev --name add_multi_tenant
```

## Step 4: Migrate Data

Run this script to migrate existing data:

```javascript
// migrate-to-tenant.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
  // 1. Create default tenant from existing data
  const tenant = await prisma.tenant.create({
    data: {
      name: "Default Shop",
      slug: "default",
      email: "admin@example.com",
      status: "ACTIVE",
      subscription: {
        create: {
          plan: "PRO",
          status: "ACTIVE",
          priceMonthly: 99,
          priceYearly: 999,
          billingCycle: "MONTHLY"
        }
      },
      settings: {
        create: {
          shopName: "Default Shop",
          currency: "GHS"
        }
      }
    }
  });

  // 2. Update all existing users with tenantId
  await prisma.user.updateMany({
    data: { tenantId: tenant.id }
  });

  // 3. Update all existing products with tenantId
  await prisma.product.updateMany({
    data: { tenantId: tenant.id }
  });

  // 4. Update all existing sales with tenantId
  await prisma.sale.updateMany({
    data: { tenantId: tenant.id }
  });

  // 5. Update all existing restocks with tenantId
  await prisma.restock.updateMany({
    data: { tenantId: tenant.id }
  });

  console.log("Migration complete!");
  console.log(`Tenant created: ${tenant.slug}`);
  console.log("Login with: slug=default, pin=<existing-pin>");
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Step 5: Update Frontend Environment

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

## Step 6: Test

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Login with slug `default` and existing PIN

## Breaking Changes

### API Changes
- All API endpoints now require `x-tenant-slug` header
- Login endpoint changed from `/api/auth/login` to `/api/tenants/login`
- Registration is now `/api/tenants/register`

### Frontend Changes
- Login now requires shop slug
- New registration page for creating shops
- Billing page for subscription management
- MoMo configuration page

### Database Changes
- Added `Tenant` model (root entity)
- Added `Subscription` model
- Added `Payment` model
- Added `MomoConfig` model
- Added `TenantSetting` model (replaces `Setting`)
- All existing models now have `tenantId` foreign key
- `User.name` is now unique per tenant (not globally unique)
- `Product.name` is now unique per tenant

## Rollback Plan

If migration fails:
1. Restore from backup: `psql -h localhost -U postgres -d ghana_pos < backup_YYYYMMDD.sql`
2. Revert to previous code version
3. Restart services

## Support

For migration assistance, contact support@wagpos.com
