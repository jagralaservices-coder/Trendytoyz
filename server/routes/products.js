const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Ensure persistent uploads directory exists safely
const { getUploadsDir, isCloudinaryConfigured, uploadToCloudinary } = require('../storageConfig');
const uploadsDir = getUploadsDir();

// Multer storage: Memory storage when Cloudinary is configured, disk storage with safe tmpdir fallback otherwise
const storage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, `${cleanName || 'product'}-${uniqueSuffix}${ext || '.jpg'}`);
      }
    });

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || (file.mimetype && file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter
});

// Helper to format product object with images and key_features parsed
function formatProduct(p) {
  if (!p) return null;
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC, is_primary DESC').all(p.id);
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
  
  let keyFeatures = [];
  try {
    keyFeatures = p.key_features ? JSON.parse(p.key_features) : [];
  } catch (e) {
    keyFeatures = p.key_features ? p.key_features.split('\n') : [];
  }

  const rawTags = p.tags || '';
  const parsedTags = Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []);

  return {
    ...p,
    age_group: p.age_group || 'All Ages',
    tags: parsedTags,
    is_free_shipping: p.is_free_shipping === 1,
    shipping_charge: parseFloat(p.shipping_charge || 0),
    is_archived: p.is_archived === 1 || p.status === 'archived' || p.is_deleted === 1,
    is_deleted: p.is_deleted === 1,
    discount_percent: p.mrp > p.selling_price ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100) : 0,
    key_features: keyFeatures,
    images: images.length > 0 ? images.map(i => i.image_url) : ['https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'],
    primary_image: images.length > 0 ? (images.find(i => i.is_primary)?.image_url || images[0].image_url) : 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80',
    variants,
    in_stock: p.stock_quantity > 0
  };
}

// GET /api/products (Public with filters & pagination)
router.get('/', (req, res) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, inStock, sort, featured, bestSeller, newArrival, page = 1, limit = 24 } = req.query;

    let conditions = ["p.status = 'active'", "(p.is_deleted = 0 OR p.is_deleted IS NULL)"];
    let params = [];

    if (category) {
      if (isNaN(category)) {
        const cat = db.prepare('SELECT id FROM categories WHERE slug = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(category);
        if (cat) {
          conditions.push('p.category_id = ?');
          params.push(cat.id);
        } else {
          // If category slug not found, return empty
          return res.json({ success: true, products: [], total: 0, page: 1, totalPages: 0 });
        }
      } else {
        conditions.push('p.category_id = ?');
        params.push(parseInt(category));
      }
    }

    if (subcategory) {
      conditions.push('p.subcategory LIKE ?');
      params.push(`%${subcategory}%`);
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.sku LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (minPrice) {
      conditions.push('p.selling_price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push('p.selling_price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (inStock === 'true') {
      conditions.push('p.stock_quantity > 0');
    }

    if (featured === 'true') {
      conditions.push('p.is_featured = 1');
    }

    if (bestSeller === 'true') {
      conditions.push('p.is_best_seller = 1');
    }

    if (newArrival === 'true') {
      conditions.push('p.is_new_arrival = 1');
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.selling_price ASC';
    else if (sort === 'price_desc') orderBy = 'p.selling_price DESC';
    else if (sort === 'newest') orderBy = 'p.created_at DESC';
    else if (sort === 'popular' || sort === 'best_selling') orderBy = 'p.is_best_seller DESC, p.created_at DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Total count
    const countSql = `SELECT COUNT(*) as count FROM products p ${whereClause}`;
    const total = db.prepare(countSql).get(...params).count;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rawProducts = db.prepare(query).all(...params, parseInt(limit), offset);
    const products = rawProducts.map(formatProduct);

    res.json({
      success: true,
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, error: 'Server error fetching products.' });
  }
});

// GET /api/products/admin (Admin list all, including disabled)
router.get('/admin/all', authenticateToken, requireAdmin, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `).all();

    const formatted = products.map(formatProduct);
    res.json({ success: true, products: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin products.' });
  }
});

// GET /api/products/:slug
router.get('/:slug', (req, res) => {
  try {
    const p = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? OR p.id = ?
    `).get(req.params.slug, req.params.slug);

    if (!p) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const formatted = formatProduct(p);

    // Fetch product reviews
    const reviews = db.prepare(`
      SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC
    `).all(p.id);

    // Related products in same category
    const relatedRaw = db.prepare(`
      SELECT p.*, c.name as category_name FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
      LIMIT 4
    `).all(p.category_id, p.id);

    const related = relatedRaw.map(formatProduct);

    res.json({
      success: true,
      product: formatted,
      reviews,
      related
    });
  } catch (err) {
    console.error('Product details error:', err);
    res.status(500).json({ success: false, error: 'Server error fetching product details.' });
  }
});

// POST /api/products (Admin Create)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name, sku, category_id, subcategory, brand, description, short_description,
      key_features, mrp, selling_price, purchase_cost, gst_percent, stock_quantity,
      low_stock_threshold, weight, dimensions, is_cod_available, is_online_available,
      is_free_shipping, shipping_charge,
      amazon_url, flipkart_url, meesho_url, seo_title, seo_description, seo_keywords,
      is_featured, is_best_seller, is_new_arrival, images, status, age_group, tags
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Product name is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, error: 'Please select a valid category.' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!cat) {
      return res.status(400).json({ success: false, error: 'The selected category does not exist. Please create or choose a category.' });
    }

    if (!mrp || parseFloat(mrp) <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid MRP greater than 0.' });
    }
    if (!selling_price || parseFloat(selling_price) <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid Selling Price greater than 0.' });
    }

    const generatedSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    let finalSku = (sku && sku.trim()) || ('TT-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    
    // Check SKU duplicate
    const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ?').get(finalSku);
    if (skuConflict) {
      finalSku = `${finalSku}-${Date.now().toString().slice(-4)}`;
    }

    const formattedTags = Array.isArray(tags) ? tags.join(', ') : (tags || '');

    const result = db.prepare(`
      INSERT INTO products (
        name, slug, sku, category_id, subcategory, brand, description, short_description,
        key_features, mrp, selling_price, purchase_cost, gst_percent, stock_quantity, low_stock_threshold,
        weight, dimensions, is_cod_available, is_online_available, is_free_shipping, shipping_charge,
        amazon_url, flipkart_url, meesho_url, seo_title, seo_description, seo_keywords,
        is_featured, is_best_seller, is_new_arrival, status, age_group, tags
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      name.trim(), generatedSlug, finalSku, Number(category_id), subcategory || '', brand || 'TRENDYTOYZ', description || '', short_description || '',
      Array.isArray(key_features) ? JSON.stringify(key_features) : (key_features || '[]'),
      parseFloat(mrp), parseFloat(selling_price), parseFloat(purchase_cost || 0), parseFloat(gst_percent || 18),
      parseInt(stock_quantity || 0), parseInt(low_stock_threshold || 5), parseFloat(weight || 0.5), dimensions || '',
      is_cod_available ? 1 : 0, is_online_available ? 1 : 0, is_free_shipping ? 1 : 0, parseFloat(shipping_charge || 0),
      amazon_url || '', flipkart_url || '', meesho_url || '',
      seo_title || name.trim(), seo_description || short_description || '', seo_keywords || '',
      is_featured ? 1 : 0, is_best_seller ? 1 : 0, is_new_arrival ? 1 : 0, status || 'active',
      age_group || 'All Ages', formattedTags
    );

    const productId = result.lastInsertRowid;

    // Insert Images
    if (images && Array.isArray(images) && images.length > 0) {
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
      images.forEach((url, idx) => {
        if (url) insertImg.run(productId, url, idx === 0 ? 1 : 0, idx + 1);
      });
    }

    res.json({ success: true, message: 'Product created successfully!', productId });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id (Admin Update)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name, sku, category_id, subcategory, brand, description, short_description,
      key_features, mrp, selling_price, purchase_cost, gst_percent, stock_quantity,
      low_stock_threshold, weight, dimensions, is_cod_available, is_online_available,
      is_free_shipping, shipping_charge,
      amazon_url, flipkart_url, meesho_url, seo_title, seo_description, seo_keywords,
      is_featured, is_best_seller, is_new_arrival, images, status, age_group, tags
    } = req.body;

    const productId = req.params.id;
    const existingProd = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existingProd) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    if (category_id) {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
      if (!cat) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
      }
    }

    let finalSku = (sku && sku.trim()) || existingProd.sku;
    const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(finalSku, productId);
    if (skuConflict) {
      return res.status(400).json({ success: false, error: `SKU "${finalSku}" is already used by another product.` });
    }

    const formattedTags = Array.isArray(tags) ? tags.join(', ') : (tags || '');
    const isArchived = status === 'archived' ? 1 : 0;

    db.prepare(`
      UPDATE products SET
        name = ?, sku = ?, category_id = ?, subcategory = ?, brand = ?, description = ?, short_description = ?,
        key_features = ?, mrp = ?, selling_price = ?, purchase_cost = ?, gst_percent = ?, stock_quantity = ?,
        low_stock_threshold = ?, weight = ?, dimensions = ?, is_cod_available = ?, is_online_available = ?,
        is_free_shipping = ?, shipping_charge = ?,
        amazon_url = ?, flipkart_url = ?, meesho_url = ?, seo_title = ?, seo_description = ?, seo_keywords = ?,
        is_featured = ?, is_best_seller = ?, is_new_arrival = ?, status = ?, age_group = ?, tags = ?, is_archived = ?
      WHERE id = ?
    `).run(
      (name && name.trim()) || existingProd.name,
      finalSku,
      category_id ? Number(category_id) : existingProd.category_id,
      subcategory !== undefined ? subcategory : existingProd.subcategory,
      brand || existingProd.brand || 'TRENDYTOYZ',
      description !== undefined ? description : existingProd.description,
      short_description !== undefined ? short_description : existingProd.short_description,
      Array.isArray(key_features) ? JSON.stringify(key_features) : (key_features || existingProd.key_features || '[]'),
      mrp !== undefined ? parseFloat(mrp) : existingProd.mrp,
      selling_price !== undefined ? parseFloat(selling_price) : existingProd.selling_price,
      purchase_cost !== undefined ? parseFloat(purchase_cost) : existingProd.purchase_cost,
      gst_percent !== undefined ? parseFloat(gst_percent) : existingProd.gst_percent,
      stock_quantity !== undefined ? parseInt(stock_quantity) : existingProd.stock_quantity,
      low_stock_threshold !== undefined ? parseInt(low_stock_threshold) : existingProd.low_stock_threshold,
      weight !== undefined ? parseFloat(weight) : existingProd.weight,
      dimensions !== undefined ? dimensions : existingProd.dimensions,
      is_cod_available !== undefined ? (is_cod_available ? 1 : 0) : existingProd.is_cod_available,
      is_online_available !== undefined ? (is_online_available ? 1 : 0) : existingProd.is_online_available,
      is_free_shipping !== undefined ? (is_free_shipping ? 1 : 0) : (existingProd.is_free_shipping || 0),
      shipping_charge !== undefined ? parseFloat(shipping_charge || 0) : (existingProd.shipping_charge || 0),
      amazon_url !== undefined ? amazon_url : existingProd.amazon_url,
      flipkart_url !== undefined ? flipkart_url : existingProd.flipkart_url,
      meesho_url !== undefined ? meesho_url : existingProd.meesho_url,
      seo_title || name || existingProd.seo_title,
      seo_description !== undefined ? seo_description : existingProd.seo_description,
      seo_keywords !== undefined ? seo_keywords : existingProd.seo_keywords,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existingProd.is_featured,
      is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : existingProd.is_best_seller,
      is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : existingProd.is_new_arrival,
      status || existingProd.status,
      age_group || existingProd.age_group || 'All Ages',
      formattedTags,
      isArchived,
      productId
    );

    if (images && Array.isArray(images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
      images.forEach((url, idx) => {
        if (url) insertImg.run(productId, url, idx === 0 ? 1 : 0, idx + 1);
      });
    }

    res.json({ success: true, message: 'Product updated successfully!' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update product.' });
  }
});

// DELETE /api/products/:id (Admin Safe Soft Delete / Archive)
// CRITICAL SAFETY RULE: Never delete customer order history or rows from order_items!
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const productId = req.params.id;
    const prod = db.prepare('SELECT id, name FROM products WHERE id = ?').get(productId);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Product not found or already deleted.' });
    }

    // Default to safe soft-delete / archive
    db.prepare(`
      UPDATE products SET is_deleted = 1, is_archived = 1, status = 'archived', deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(productId);

    res.json({
      success: true,
      message: `Product "${prod.name}" archived safely. Past order items and sales data preserved.`,
      product_id: productId
    });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete product.' });
  }
});

// POST /api/products/:id/restore (Admin Restore Archived / Soft-Deleted Product)
router.post('/:id/restore', authenticateToken, requireAdmin, (req, res) => {
  try {
    const productId = req.params.id;
    const prod = db.prepare('SELECT id, name FROM products WHERE id = ?').get(productId);
    if (!prod) return res.status(404).json({ success: false, error: 'Product not found.' });

    db.prepare(`
      UPDATE products SET is_deleted = 0, is_archived = 0, status = 'active', deleted_at = NULL
      WHERE id = ?
    `).run(productId);

    res.json({
      success: true,
      message: `Product "${prod.name}" restored to active status!`,
      product_id: productId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to restore product.' });
  }
});

// POST /api/products/:id/archive (Admin Quick Archive Toggle)
router.post('/:id/archive', authenticateToken, requireAdmin, (req, res) => {
  try {
    const prod = db.prepare('SELECT id, status, is_archived FROM products WHERE id = ?').get(req.params.id);
    if (!prod) return res.status(404).json({ success: false, error: 'Product not found.' });

    const newArchived = prod.is_archived === 1 || prod.status === 'archived' ? 0 : 1;
    const newStatus = newArchived === 1 ? 'archived' : 'active';

    db.prepare('UPDATE products SET status = ?, is_archived = ? WHERE id = ?').run(newStatus, newArchived, req.params.id);
    res.json({
      success: true,
      message: newArchived === 1 ? 'Product archived successfully.' : 'Product restored to active.',
      is_archived: newArchived === 1,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle archive status.' });
  }
});

// POST /api/products/admin/bulk-status (Bulk Activate / Deactivate / Archive)
router.post('/admin/bulk-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, error: 'Product IDs array and target status are required.' });
    }

    const isArchived = status === 'archived' ? 1 : 0;
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE products SET status = ?, is_archived = ? WHERE id IN (${placeholders})`).run(status, isArchived, ...ids);

    res.json({ success: true, message: `Updated status to "${status}" for ${ids.length} products.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Bulk status update failed.' });
  }
});

// POST /api/products/admin/bulk-delete (Bulk Delete / Soft Delete)
router.post('/admin/bulk-delete', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { ids, softDelete = true } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Product IDs array is required.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    if (softDelete) {
      db.prepare(`UPDATE products SET status = 'archived', is_archived = 1 WHERE id IN (${placeholders})`).run(...ids);
      res.json({ success: true, message: `Archived ${ids.length} products.` });
    } else {
      db.prepare(`DELETE FROM product_images WHERE product_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
      res.json({ success: true, message: `Permanently deleted ${ids.length} products.` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Bulk delete failed.' });
  }
});

// POST /api/products/admin/bulk-price-update (Bulk Price Update)
router.post('/admin/bulk-price-update', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { ids, type, value, direction } = req.body; // type: 'percentage' | 'fixed', direction: 'increase' | 'decrease'
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !value) {
      return res.status(400).json({ success: false, error: 'Product IDs and price adjustment value are required.' });
    }

    const numVal = parseFloat(value);
    const sign = direction === 'decrease' ? -1 : 1;

    const placeholders = ids.map(() => '?').join(',');
    const prods = db.prepare(`SELECT id, selling_price, mrp FROM products WHERE id IN (${placeholders})`).all(...ids);

    const updateStmt = db.prepare('UPDATE products SET selling_price = ? WHERE id = ?');

    for (const p of prods) {
      let newPrice = p.selling_price;
      if (type === 'percentage') {
        const delta = Math.round((p.selling_price * (numVal / 100)) * sign);
        newPrice = Math.max(1, p.selling_price + delta);
      } else {
        newPrice = Math.max(1, Math.round(p.selling_price + (numVal * sign)));
      }
      updateStmt.run(newPrice, p.id);
    }

    res.json({ success: true, message: `Successfully updated prices for ${ids.length} products.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Bulk price update failed.' });
  }
});

// POST /api/products/duplicate/:id (Admin Duplicate)
router.post('/duplicate/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orig = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!orig) return res.status(404).json({ success: false, error: 'Product not found.' });

    const newSlug = orig.slug + '-copy-' + Date.now().toString().slice(-4);
    const newSku = orig.sku + '-COPY';

    const result = db.prepare(`
      INSERT INTO products (
        name, slug, sku, category_id, subcategory, brand, description, short_description,
        key_features, mrp, selling_price, purchase_cost, gst_percent, stock_quantity, low_stock_threshold,
        weight, dimensions, is_cod_available, is_online_available, amazon_url, flipkart_url, meesho_url,
        seo_title, seo_description, seo_keywords, is_featured, is_best_seller, is_new_arrival, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 'active'
      )
    `).run(
      orig.name + ' (Copy)', newSlug, newSku, orig.category_id, orig.subcategory, orig.brand, orig.description, orig.short_description,
      orig.key_features, orig.mrp, orig.selling_price, orig.purchase_cost, orig.gst_percent, orig.stock_quantity, orig.low_stock_threshold,
      orig.weight, orig.dimensions, orig.is_cod_available, orig.is_online_available, orig.amazon_url, orig.flipkart_url, orig.meesho_url,
      orig.seo_title, orig.seo_description, orig.seo_keywords, orig.is_featured, orig.is_best_seller, orig.is_new_arrival
    );

    const newProdId = result.lastInsertRowid;
    const origImgs = db.prepare('SELECT * FROM product_images WHERE product_id = ?').all(orig.id);
    const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
    origImgs.forEach(img => {
      insertImg.run(newProdId, img.image_url, img.is_primary, img.display_order);
    });

    res.json({ success: true, message: 'Product duplicated successfully!', newProductId: newProdId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to duplicate product.' });
  }
});

// PATCH /api/products/:id/toggle-cod (Admin Quick Toggle COD)
router.patch('/:id/toggle-cod', authenticateToken, requireAdmin, (req, res) => {
  try {
    const product = db.prepare('SELECT id, name, is_cod_available FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });

    const newCod = product.is_cod_available === 1 ? 0 : 1;
    db.prepare('UPDATE products SET is_cod_available = ? WHERE id = ?').run(newCod, req.params.id);

    res.json({
      success: true,
      message: `Cash on Delivery (COD) for "${product.name}" is now ${newCod === 1 ? 'AVAILABLE' : 'DISABLED'}.`,
      is_cod_available: newCod
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to toggle COD.' });
  }
});

// POST /api/products/upload-images (Admin Upload Multiple Product Images)
router.post('/upload-images', authenticateToken, requireAdmin, (req, res) => {
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Image upload failed.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files were uploaded.' });
    }

    try {
      if (isCloudinaryConfigured()) {
        const uploadPromises = req.files.map(f => uploadToCloudinary(f.buffer, f.originalname));
        const urls = await Promise.all(uploadPromises);
        return res.json({ success: true, message: `${urls.length} image(s) uploaded to Cloudinary!`, urls, storage: 'cloudinary' });
      }

      const urls = req.files.map(f => `/uploads/${f.filename}`);
      return res.json({ success: true, message: `${req.files.length} image(s) uploaded locally!`, urls, storage: 'local' });
    } catch (uploadErr) {
      console.error('Image upload error:', uploadErr);
      return res.status(500).json({ success: false, error: 'Failed to process image uploads: ' + uploadErr.message });
    }
  });
});

// POST /api/products/upload-image (Admin Upload Single Product Image)
router.post('/upload-image', authenticateToken, requireAdmin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Image upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file was uploaded.' });
    }

    try {
      if (isCloudinaryConfigured()) {
        const url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        return res.json({ success: true, message: 'Image uploaded to Cloudinary!', url, storage: 'cloudinary' });
      }

      const url = `/uploads/${req.file.filename}`;
      return res.json({ success: true, message: 'Image uploaded locally!', url, storage: 'local' });
    } catch (uploadErr) {
      console.error('Image upload error:', uploadErr);
      return res.status(500).json({ success: false, error: 'Failed to upload image: ' + uploadErr.message });
    }
  });
});

module.exports = router;
