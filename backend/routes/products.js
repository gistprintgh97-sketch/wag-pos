const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { protect, adminOnly } = require("../middleware/auth");
const { extractTenant } = require("../middleware/tenant");
const prisma = new PrismaClient();

// Helper: ensure all queries include tenant filter
const tenantWhere = (req, extra = {}) => ({ tenantId: req.tenant.id, ...extra });

// Get all products
router.get("/", extractTenant, protect, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: tenantWhere(req, { deleted: false }),
      include: {
        restocks: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
      orderBy: { name: "asc" }
    });
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get single product
router.get("/:id", extractTenant, protect, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: tenantWhere(req, { id: parseInt(req.params.id) }),
      include: { restocks: { orderBy: { createdAt: "desc" } } }
    });
    if (!product || product.deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// Create product (Admin only)
router.post("/", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { name, price, costPrice, stock, barcode, category } = req.body;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({ message: "Name, price, and stock are required" });
    }

    if (price <= 0 || costPrice < 0 || stock < 0) {
      return res.status(400).json({ message: "Invalid price or stock values" });
    }

    // Check plan limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: { subscription: true, _count: { select: { products: true } } }
    });

    const planLimits = {
      STARTER: 100, BASIC: 500, PRO: 2000, ENTERPRISE: 10000
    };
    const maxProducts = planLimits[tenant.subscription?.plan] || 100;

    if (tenant._count.products >= maxProducts) {
      return res.status(403).json({
        message: `Product limit reached (${maxProducts}). Upgrade your plan to add more products.`
      });
    }

    const product = await prisma.product.create({
      data: {
        tenantId: req.tenant.id,
        name: name.trim(),
        price: parseFloat(price),
        costPrice: parseFloat(costPrice || 0),
        stock: parseInt(stock),
        barcode: barcode?.trim() || null,
        category: category?.trim() || "General"
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Product with this name already exists" });
    }
    res.status(500).json({ message: "Failed to create product" });
  }
});

// Update product
router.put("/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { name, price, costPrice, stock, barcode, category } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.product.findFirst({
      where: tenantWhere(req, { id })
    });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name?.trim(),
        price: price !== undefined ? parseFloat(price) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        barcode: barcode !== undefined ? barcode?.trim() || null : undefined,
        category: category !== undefined ? category?.trim() || "General" : undefined
      }
    });

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Failed to update product" });
  }
});

// Restock product
router.put("/restock/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { quantity, supplier, costPrice } = req.body;
    const id = parseInt(req.params.id);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Valid quantity required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const restock = await tx.restock.create({
        data: {
          tenantId: req.tenant.id,
          quantity: parseInt(quantity),
          supplier: supplier || null,
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          productId: id
        }
      });

      const product = await tx.product.update({
        where: { id },
        data: { stock: { increment: parseInt(quantity) } }
      });

      return { restock, product };
    });

    res.json({
      message: "Restocked successfully",
      product: result.product,
      restock: result.restock
    });
  } catch (error) {
    console.error("Restock error:", error);
    res.status(500).json({ message: "Failed to restock product" });
  }
});

// Soft delete product
router.delete("/:id", extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.product.update({
      where: { id },
      data: { deleted: true }
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// Get low stock products
router.get("/low-stock/alert", extractTenant, protect, async (req, res) => {
  try {
    const settings = await prisma.tenantSetting.findUnique({
      where: { tenantId: req.tenant.id }
    });
    const threshold = settings?.lowStockThreshold || 10;

    const products = await prisma.product.findMany({
      where: tenantWhere(req, {
        deleted: false,
        stock: { lte: threshold }
      }),
      orderBy: { stock: "asc" }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock products" });
  }
});

// BULK UPLOAD endpoint - FIXED to match Prisma schema
router.post('/bulk-upload', extractTenant, protect, adminOnly, async (req, res) => {
  try {
    const { products, duplicateAction = 'update' } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided. Please upload a valid file.' });
    }

    const tenantId = req.tenant.id;
    const results = { success: [], failed: [] };

    // Plan limits
    const MAX_PRODUCTS = {
      'ENTERPRISE': 10000,
      'PRO': 2000,
      'BASIC': 500,
      'STARTER': 100
    };

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true }
    });

    const planLimit = MAX_PRODUCTS[tenant?.subscription?.plan] || 100;

    // Check current product count
    const currentCount = await prisma.product.count({ 
      where: { tenantId, deleted: false } 
    });

    if (currentCount + products.length > planLimit && duplicateAction !== 'update') {
      return res.status(400).json({ 
        message: `Plan limit exceeded. You can add ${planLimit - currentCount} more products on your ${tenant?.subscription?.plan || 'STARTER'} plan.` 
      });
    }

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (!row.name || String(row.name).trim() === '') {
          throw new Error('Product name is required');
        }

        const price = parseFloat(row.price);
        if (isNaN(price) || price < 0) {
          throw new Error('Valid price is required (must be a positive number)');
        }

        const stock = parseInt(row.stock);
        if (isNaN(stock) || stock < 0) {
          throw new Error('Valid stock quantity is required (must be a positive number)');
        }

        // Build product data matching Prisma schema exactly
        const productData = {
          name: String(row.name).trim(),
          price: price,
          stock: stock,
          costPrice: row.cost ? parseFloat(row.cost) || 0 : 0,  // Map CSV 'cost' to Prisma 'costPrice'
          category: row.category ? String(row.category).trim() : 'General',
          barcode: row.barcode ? String(row.barcode).trim() : null,
          tenantId: tenantId
        };

        // Check for duplicate by name
        const existing = await prisma.product.findFirst({
          where: { name: productData.name, tenantId }
        });

        if (existing) {
          // Handle duplicate based on user choice
          if (duplicateAction === 'skip') {
            results.success.push({ 
              row: rowNum, 
              name: productData.name, 
              action: 'skipped',
              message: 'Duplicate found, skipped as requested'
            });
          } 
          else if (duplicateAction === 'replace') {
            // Complete overwrite
            await prisma.product.update({
              where: { id: existing.id },
              data: {
                name: productData.name,
                price: productData.price,
                costPrice: productData.costPrice,
                stock: productData.stock,
                category: productData.category,
                barcode: productData.barcode
              }
            });
            results.success.push({ 
              row: rowNum, 
              name: productData.name, 
              action: 'replaced',
              message: 'Duplicate replaced with new data'
            });
          } 
          else {
            // Default: update - merge data (update price, add stock)
            await prisma.product.update({
              where: { id: existing.id },
              data: {
                price: productData.price,
                costPrice: productData.costPrice || existing.costPrice,
                stock: { increment: productData.stock },
                category: productData.category,
                barcode: productData.barcode || existing.barcode
              }
            });
            results.success.push({ 
              row: rowNum, 
              name: productData.name, 
              action: 'updated',
              message: `Price updated, stock +${productData.stock}`
            });
          }
        } else {
          // Create new product
          await prisma.product.create({ data: productData });
          results.success.push({ 
            row: rowNum, 
            name: productData.name, 
            action: 'created',
            message: 'New product created'
          });
        }

      } catch (error) {
        results.failed.push({ 
          row: rowNum, 
          name: row.name || 'Unknown', 
          error: error.message 
        });
      }
    }

    res.json({
      message: `Upload complete. ${results.success.length} succeeded, ${results.failed.length} failed.`,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Server error during bulk upload' });
  }
});

module.exports = router;