const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Shop',
      slug: 'demo',
      email: 'demo@wagpos.com',
      phone: '0240000000',
      address: 'Accra, Ghana',
      businessType: 'SUPERMARKET',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Tenant created:', tenant.slug);

  // Create user with PIN
  const user = await prisma.user.create({
    data: {
      name: 'Demo Cashier',
      pin: '1234',
      role: 'CASHIER',
      tenantId: tenant.id,
      isActive: true
    }
  });
  console.log('✅ User created:', user.name, 'PIN:', user.pin);
}

seed()
  .then(() => {
    console.log('🎉 Seed complete!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });