const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const { logActivity } = require('../services/activityLogger');
const prisma = new PrismaClient();

// ─── GET SALES HISTORY (Paginated, ALL records by default) ───
router.get("/history", extractTenant, protect, async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate, today: todayFlag } = req.query;
    
    const where = { tenantId: req.tenant.id };
    
    // Optional: filter to today only
    if (todayFlag === 'true') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    } 
    // Optional: date range filter
    else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { name: true } }
            }
          },
          cashier: { select: { name: true, id: true } }
        },
        skip,
        take
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      sales,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error("Sales history error:", error);
    res.status(500).json({ message: "Failed to fetch sales history" });
  }
});

// ─── CREATE NEW SALE ───
router.post("/", extractTenant, protect, async (req, res) => {
  try {
    const { items, paymentMethod, momoPhone } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.id, tenantId: req.tenant.id }
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.id}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      total += product.price * item.quantity;
      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const sale = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      const newSale = await tx.sale.create({
        data: {
          tenantId: req.tenant.id,
          total,
          paymentMethod: paymentMethod || "Cash",
          momoPhone: momoPhone || null,
          cashierId: req.user.id,
          items: { create: saleItems }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true } }
            }
          },
          cashier: { select: { name: true } }
        }
      });

      return newSale;
    });

    await logActivity({
      tenantId: req.tenant.id,
      userId: req.user.id,
      action: 'SALE_CREATED',
      metadata: { 
        amount: sale.total, 
        items: sale.items.length, 
        paymentMethod: sale.paymentMethod 
      },
      req,
    });

    res.status(201).json({
      message: "Sale completed successfully",
      sale
    });
  } catch (error) {
    console.error("Create sale error:", error);
    res.status(500).json({ message: "Failed to process sale" });
  }
});

module.exports = router;