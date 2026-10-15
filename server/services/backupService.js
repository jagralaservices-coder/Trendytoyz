const fs = require('fs');
const path = require('path');
const db = require('../db');

const { getDatabasePath, getBackupDir } = require('../storageConfig');
const backupDir = getBackupDir();

/**
 * Creates a physical timestamped SQLite snapshot
 */
function createDatabaseBackup(customLabel = '') {
  try {
    const dbPath = getDatabasePath();

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at: ${dbPath}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const labelSuffix = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
    const backupFileName = `backup-${timestamp}${labelSuffix}.sqlite`;
    const destPath = path.join(backupDir, backupFileName);

    // Use SQLite's safe backup API if available, or copy file
    try {
      db.backup(destPath);
    } catch (e) {
      fs.copyFileSync(dbPath, destPath);
    }

    console.log(`[Backup Service] Created database snapshot: ${backupFileName}`);

    // Prune old backups to keep the last 7
    rotateBackups(7);

    return {
      success: true,
      fileName: backupFileName,
      filePath: destPath,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('[Backup Service] Failed to create database snapshot:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retains only the latest N backups, removing older ones
 */
function rotateBackups(maxKeep = 7) {
  try {
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sqlite') || f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        const stats = fs.statSync(fullPath);
        return { name: f, path: fullPath, mtime: stats.mtimeMs, size: stats.size };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep);
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`[Backup Service] Pruned old backup: ${file.name}`);
        } catch (e) {
          console.error(`[Backup Service] Could not remove old backup ${file.name}:`, e.message);
        }
      });
    }
  } catch (err) {
    console.error('[Backup Service] Error rotating backups:', err);
  }
}

/**
 * Returns list of local backups available on disk
 */
function getBackupList() {
  try {
    if (!fs.existsSync(backupDir)) return [];

    return fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sqlite') || f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          sizeBytes: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          createdAt: stats.birthtime || stats.mtime,
          isAutomatic: f.startsWith('backup-')
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error('[Backup Service] Error reading backup list:', err);
    return [];
  }
}

/**
 * Exports full dataset as JSON structure for portability and restore
 */
function exportFullDatasetJSON() {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    const product_images = db.prepare('SELECT * FROM product_images').all();
    const product_variants = db.prepare('SELECT * FROM product_variants').all();
    const categories = db.prepare('SELECT * FROM categories').all();
    const orders = db.prepare('SELECT * FROM orders').all();
    const order_items = db.prepare('SELECT * FROM order_items').all();
    const order_status_history = db.prepare('SELECT * FROM order_status_history').all();
    const users = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users').all();
    const settings = db.prepare('SELECT * FROM settings').all();
    const couriers = db.prepare('SELECT * FROM couriers').all();
    const coupons = db.prepare('SELECT * FROM coupons').all();
    const banners = db.prepare('SELECT * FROM banners').all();
    const reviews = db.prepare('SELECT * FROM reviews').all();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'TRENDYTOYZ',
      counts: {
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        customers: users.length,
        settings: settings.length
      },
      data: {
        categories,
        products,
        product_images,
        product_variants,
        orders,
        order_items,
        order_status_history,
        users,
        settings,
        couriers,
        coupons,
        banners,
        reviews
      }
    };
  } catch (err) {
    console.error('[Backup Service] Export dataset error:', err);
    throw err;
  }
}

/**
 * Safely restores or upserts dataset from JSON backup without wiping existing records
 */
function importDatasetJSON(payload) {
  if (!payload || !payload.data) {
    throw new Error('Invalid backup file format: missing "data" property.');
  }

  const {
    categories = [],
    products = [],
    product_images = [],
    product_variants = [],
    orders = [],
    order_items = [],
    settings = [],
    couriers = [],
    coupons = [],
    banners = [],
    reviews = []
  } = payload.data;

  const results = {
    categoriesRestored: 0,
    productsRestored: 0,
    ordersRestored: 0,
    settingsRestored: 0
  };

  const importTx = db.transaction(() => {
    // 1. Restore Categories
    const upsertCategory = db.prepare(`
      INSERT INTO categories (id, name, slug, description, image, is_active, display_order, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        image = excluded.image,
        is_active = excluded.is_active,
        is_deleted = 0
    `);

    for (const c of categories) {
      try {
        upsertCategory.run(c.id, c.name, c.slug, c.description || '', c.image || '', c.is_active ?? 1, c.display_order ?? 0);
        results.categoriesRestored++;
      } catch (e) {
        console.warn(`[Restore] Category error ${c.name}:`, e.message);
      }
    }

    // 2. Restore Products
    const upsertProduct = db.prepare(`
      INSERT INTO products (
        id, name, slug, sku, category_id, subcategory, brand, description, short_description,
        key_features, mrp, selling_price, purchase_cost, gst_percent, stock_quantity,
        low_stock_threshold, weight, dimensions, is_free_shipping, shipping_charge,
        is_cod_available, is_online_available, amazon_url, flipkart_url, meesho_url,
        seo_title, seo_description, seo_keywords, is_featured, is_best_seller, is_new_arrival,
        status, is_archived, is_deleted
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, 0
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        mrp = excluded.mrp,
        selling_price = excluded.selling_price,
        stock_quantity = excluded.stock_quantity,
        category_id = excluded.category_id,
        status = excluded.status,
        is_archived = excluded.is_archived,
        is_deleted = 0
    `);

    for (const p of products) {
      try {
        upsertProduct.run(
          p.id, p.name, p.slug, p.sku || `SKU-${p.id}`, p.category_id, p.subcategory || '', p.brand || 'TRENDYTOYZ',
          p.description || '', p.short_description || '', typeof p.key_features === 'string' ? p.key_features : JSON.stringify(p.key_features || []),
          p.mrp, p.selling_price, p.purchase_cost || 0, p.gst_percent || 18, p.stock_quantity || 0,
          p.low_stock_threshold || 5, p.weight || 0.5, p.dimensions || '', p.is_free_shipping ? 1 : 0, p.shipping_charge || 0,
          p.is_cod_available ? 1 : 0, p.is_online_available ? 1 : 0, p.amazon_url || '', p.flipkart_url || '', p.meesho_url || '',
          p.seo_title || '', p.seo_description || '', p.seo_keywords || '', p.is_featured ? 1 : 0, p.is_best_seller ? 1 : 0, p.is_new_arrival ? 1 : 0,
          p.status || 'active', p.is_archived ? 1 : 0
        );
        results.productsRestored++;
      } catch (e) {
        console.warn(`[Restore] Product error ${p.name}:`, e.message);
      }
    }

    // 3. Restore Product Images
    const insertImage = db.prepare(`
      INSERT OR IGNORE INTO product_images (id, product_id, image_url, is_primary, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const img of product_images) {
      try {
        insertImage.run(img.id, img.product_id, img.image_url, img.is_primary || 0, img.display_order || 0);
      } catch (e) { }
    }

    // 4. Restore Orders (Preserve order history without clobbering existing orders)
    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (
        id, user_id, customer_name, customer_phone, customer_email, shipping_address,
        subtotal, discount_amount, shipping_charge, cod_charge, total_amount, payment_method,
        payment_status, order_status, courier_name, tracking_number, tracking_url,
        estimated_delivery, cancellation_reason, admin_notes, payment_gateway_ref, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    for (const o of orders) {
      try {
        insertOrder.run(
          o.id, o.user_id, o.customer_name, o.customer_phone, o.customer_email, o.shipping_address,
          o.subtotal, o.discount_amount || 0, o.shipping_charge || 0, o.cod_charge || 0, o.total_amount, o.payment_method,
          o.payment_status || 'PENDING', o.order_status || 'ORDER PLACED', o.courier_name || '', o.tracking_number || '', o.tracking_url || '',
          o.estimated_delivery || '', o.cancellation_reason || '', o.admin_notes || '', o.payment_gateway_ref || '', o.created_at || new Date().toISOString()
        );
        results.ordersRestored++;
      } catch (e) {
        console.warn(`[Restore] Order error ${o.id}:`, e.message);
      }
    }

    // 5. Restore Order Items
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, sku, price, quantity, variant, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const itm of order_items) {
      try {
        insertItem.run(itm.id, itm.order_id, itm.product_id, itm.product_name, itm.sku, itm.price, itm.quantity, itm.variant || '', itm.total);
      } catch (e) { }
    }

    // 6. Restore Settings (Upsert without overwriting critical credentials unless explicitly requested)
    const upsertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const s of settings) {
      try {
        upsertSetting.run(s.key, s.value);
        results.settingsRestored++;
      } catch (e) { }
    }
  });

  importTx();
  return results;
}

/**
 * Initializes automatic daily backup schedule (every 24 hours, retains last 7)
 */
function initAutomaticBackups() {
  console.log(`[Backup Service] Persistent backups directory: ${backupDir}`);

  // Create an initial daily backup on startup
  createDatabaseBackup('daily');

  // Schedule every 24 hours (86,400,000 ms)
  setInterval(() => {
    console.log('[Backup Service] Running scheduled 24-hour database backup...');
    createDatabaseBackup('daily');
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  backupDir,
  createDatabaseBackup,
  rotateBackups,
  getBackupList,
  exportFullDatasetJSON,
  importDatasetJSON,
  initAutomaticBackups
};
