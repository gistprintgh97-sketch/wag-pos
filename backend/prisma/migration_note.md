-- Migration: Add multi-tenant support
-- Run: npx prisma migrate dev --name add_multi_tenant

-- This migration creates the tenant isolation layer
-- All existing data will be migrated via seed/migration script

-- Note: Run prisma/seed.js after migration to create default tenant
-- and associate existing data
