const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Check if demo tenant already exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: "demo" }
    });

    if (existing) {
      console.log("✅ Demo tenant already exists. Skipping seed.");
      return;
    }

    // Create demo tenant
    const demoTenant = await prisma.tenant.create({
      data: {
        name: "Demo Supermarket",
        slug: "demo",
        email: "demo@wagpos.com",
        phone: "+233 20 123 4567",
        businessType: "SUPERMARKET",
        status: "ACTIVE",
      }
    });

    console.log("✅ Created demo tenant:", demoTenant.slug);

    // Create subscription
    await prisma.subscription.create({
      data: {
        tenantId: demoTenant.id,
        plan: "PRO",
        status: "ACTIVE",
        priceMonthly: 99,
        priceYearly: 999,
        billingCycle: "MONTHLY",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create settings
    await prisma.tenantSetting.create({
      data: {
        tenantId: demoTenant.id,
        shopName: "Demo Supermarket",
        currency: "GHS",
        receiptFooter: "Thank you for shopping with us!",
        lowStockThreshold: 10,
        enableMomo: true,
        enableCard: true
      }
    });

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        name: "Admin",
        pin: "1234",
        role: "ADMIN"
      }
    });

    // Create cashier
    const cashier = await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        name: "Cashier",
        pin: "5678",
        role: "CASHIER"
      }
    });

    console.log("✅ Created users: Admin (PIN: 1234), Cashier (PIN: 5678)");

    // Create sample products
    const products = [
      { name: "Coca Cola", price: 5.00, costPrice: 3.50, stock: 50, category: "Beverages" },
      { name: "Pepsi", price: 4.50, costPrice: 3.00, stock: 45, category: "Beverages" },
      { name: "Bottle Water", price: 2.00, costPrice: 1.00, stock: 100, category: "Beverages" },
      { name: "Bread", price: 8.00, costPrice: 5.00, stock: 20, category: "Bakery" },
      { name: "Sugar (1kg)", price: 15.00, costPrice: 12.00, stock: 30, category: "Groceries" },
      { name: "Rice (5kg)", price: 45.00, costPrice: 38.00, stock: 25, category: "Groceries" },
      { name: "Cooking Oil (1L)", price: 18.00, costPrice: 15.00, stock: 40, category: "Groceries" },
      { name: "Soap", price: 6.00, costPrice: 4.00, stock: 60, category: "Household" },
      { name: "Toothpaste", price: 12.00, costPrice: 9.00, stock: 35, category: "Personal Care" },
      { name: "Milo (Nestle)", price: 25.00, costPrice: 20.00, stock: 15, category: "Beverages" },
      { name: "Milk (1L)", price: 10.00, costPrice: 8.00, stock: 8, category: "Dairy" },
      { name: "Eggs (crate)", price: 35.00, costPrice: 30.00, stock: 12, category: "Dairy" }
    ];

    for (const p of products) {
      await prisma.product.create({
        data: {
          tenantId: demoTenant.id,
          ...p
        }
      });
    }

    console.log("✅ Created", products.length, "sample products");

    // Create a sample sale
    const saleProducts = await prisma.product.findMany({
      where: { tenantId: demoTenant.id },
      take: 3
    });

    const total = saleProducts.reduce((sum, p) => sum + p.price * 2, 0);

    await prisma.sale.create({
      data: {
        tenantId: demoTenant.id,
        total,
        paymentMethod: "Cash",
        cashierId: cashier.id,
        items: {
          create: saleProducts.map(p => ({
            productId: p.id,
            quantity: 2,
            price: p.price
          }))
        }
      }
    });

    console.log("✅ Created sample sale");
    console.log("\n🎉 Seed complete!");
    console.log(" Login with: slug=demo, pin=1234 (Admin) or 5678 (Cashier)");

  } catch (error) {
    console.error("❌ Seed error:", error.message);
    // Don't throw - allow server to start
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message);
    // Exit gracefully so server can still start
  })
  .finally(async () => {
    await prisma.$disconnect();
  });