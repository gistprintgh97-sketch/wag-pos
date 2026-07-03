const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logActivity({ tenantId, userId, action, metadata, req }) {
  try {
    await prisma.activityLog.create({
      data: {
        tenantId: tenantId || null,
        userId: userId || null,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip: req?.ip || req?.headers['x-forwarded-for'] || null,
      },
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
    // Don't throw — logging should never break the main flow
  }
}

module.exports = { logActivity };