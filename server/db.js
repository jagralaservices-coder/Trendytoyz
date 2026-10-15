const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Determine persistent database location safely
const { getDatabasePath } = require('./storageConfig');
const dbPath = getDatabasePath();

// Auto-migrate legacy server/database.sqlite to data/database.sqlite if needed
const legacyDbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
  try {
    console.log(`[Data Persistence] Migrating database from legacy ${legacyDbPath} to ${dbPath}...`);
    fs.copyFileSync(legacyDbPath, dbPath);
    if (fs.existsSync(legacyDbPath + '-wal')) fs.copyFileSync(legacyDbPath + '-wal', dbPath + '-wal');
    if (fs.existsSync(legacyDbPath + '-shm')) fs.copyFileSync(legacyDbPath + '-shm', dbPath + '-shm');
  } catch (err) {
    console.warn(`[Data Persistence] Legacy migration warning:`, err.message);
  }
}

let db = null;
let dbStatus = 'connecting';
let dbError = null;

const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'getDbStatus') {
      return () => ({ status: dbStatus, error: dbError, path: dbPath });
    }
    if (prop === 'connectDb') {
      return connectDb;
    }
    if (prop === 'getRawDb') {
      return () => db;
    }
    if (!db) {
      if (typeof prop === 'string' && ['prepare', 'exec', 'pragma', 'transaction', 'backup'].includes(prop)) {
        return function() {
          throw new Error(`Database unavailable (${dbStatus}: ${dbError || 'connecting'}). Retrying in background...`);
        };
      }
      return undefined;
    }
    const val = db[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  }
});

function connectDb() {
  try {
    console.log(`Connecting SQLite Database at: ${dbPath}`);
    db = new Database(dbPath);
    // Enable WAL mode for high performance concurrency & enforce relational integrity
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb();
    logDataIntegrityCheck();
    dbStatus = 'connected';
    dbError = null;
    return true;
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
    console.error(`[Database Error] SQLite initialization failed (${err.message}). Server remains alive and will retry in 5s.`);
    setTimeout(connectDb, 5000);
    return false;
  }
}

function initDb() {
  console.log(`Initializing SQLite Database at: ${dbPath}`);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL,
      subcategory TEXT,
      brand TEXT DEFAULT 'TRENDYTOYZ',
      description TEXT,
      short_description TEXT,
      key_features TEXT,
      mrp REAL NOT NULL,
      selling_price REAL NOT NULL,
      purchase_cost REAL DEFAULT 0,
      gst_percent REAL DEFAULT 18,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      weight REAL DEFAULT 0.5,
      dimensions TEXT DEFAULT '',
      is_free_shipping INTEGER DEFAULT 0,
      shipping_charge REAL DEFAULT 0,
      is_cod_available INTEGER DEFAULT 0,
      is_online_available INTEGER DEFAULT 1,
      amazon_url TEXT DEFAULT '',
      flipkart_url TEXT DEFAULT '',
      meesho_url TEXT DEFAULT '',
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      seo_keywords TEXT DEFAULT '',
      is_featured INTEGER DEFAULT 0,
      is_best_seller INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Product Images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Product Variants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sku TEXT,
      price REAL,
      stock_quantity INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Customer Addresses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      street_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      shipping_charge REAL DEFAULT 0,
      cod_charge REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'PENDING',
      order_status TEXT DEFAULT 'ORDER PLACED',
      courier_name TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      tracking_url TEXT DEFAULT '',
      estimated_delivery TEXT DEFAULT '',
      cancellation_reason TEXT DEFAULT '',
      admin_notes TEXT DEFAULT '',
      payment_gateway_ref TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Order Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      variant TEXT DEFAULT '',
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Order Status History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      gateway TEXT NOT NULL,
      transaction_id TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      payload TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      start_date TEXT,
      expiry_date TEXT,
      usage_limit INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      status TEXT DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Wishlists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Banners table
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      button_text TEXT DEFAULT 'Shop Now',
      button_url TEXT DEFAULT '/shop',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Settings table (Key-Value)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Couriers table for Shipping & Courier Tracking Module
  db.exec(`
    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      logo TEXT DEFAULT '',
      tracking_url_template TEXT NOT NULL,
      phone TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for products, categories, orders & reviews (Soft Delete & Persistence Columns)
  try { db.exec("ALTER TABLE categories ADD COLUMN is_deleted INTEGER DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE categories ADD COLUMN deleted_at DATETIME"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN deleted_at DATETIME"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN age_group TEXT DEFAULT 'All Ages'"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN tags TEXT DEFAULT ''"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN is_free_shipping INTEGER DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE products ADD COLUMN shipping_charge REAL DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE orders ADD COLUMN is_deleted INTEGER DEFAULT 0"); } catch (e) { }
  try { db.exec("ALTER TABLE orders ADD COLUMN archived_at DATETIME"); } catch (e) { }
  try { db.exec("ALTER TABLE orders ADD COLUMN dispatch_date DATETIME"); } catch (e) { }

  // Migrations for users table (Google & Apple Sign-In support)
  try { db.exec("ALTER TABLE users ADD COLUMN google_id TEXT"); } catch (e) { }
  try { db.exec("ALTER TABLE users ADD COLUMN apple_id TEXT"); } catch (e) { }
  try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''"); } catch (e) { }

  // Migrations for reviews table (Customer review with image upload)
  try { db.exec("ALTER TABLE reviews ADD COLUMN image_url TEXT DEFAULT ''"); } catch (e) { }
  try { db.exec("ALTER TABLE reviews ADD COLUMN is_verified_buyer INTEGER DEFAULT 1"); } catch (e) { }

  // Seed non-destructively
  seedInitialData();

  // Log Startup Integrity Check
  logDataIntegrityCheck();
}

/**
 * NON-DESTRUCTIVE SEEDING SCRIPT
 * CRITICAL SAFETY RULE: Never overwrite, truncate, or reset existing user data.
 * All inserts strictly use INSERT OR IGNORE and only initialize records when absent.
 */
function seedInitialData() {
  // Check Admin Users: Only seed if NO admin exists or if primary admin is missing
  const adminCheck = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin'").get();
  if (!adminCheck || adminCheck.count === 0) {
    const defaultAdminPass = process.env.ADMIN_PASSWORD || 'S@lman2538';
    const hashedPass = bcrypt.hashSync(defaultAdminPass, 10);
    const primaryAdminEmail = process.env.ADMIN_EMAIL || 'trendytoys.info@gmail.com';
    const secondaryAdminEmail = 'sallujags@gmail.com';

    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO users (name, email, phone, password, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `);

    insertAdmin.run('Admin TRENDYTOYZ', primaryAdminEmail, '+91 7718862274', hashedPass);
    insertAdmin.run('Admin TRENDYTOYZ (Secondary)', secondaryAdminEmail, '+91 7718862274', hashedPass);
    console.log(`[Seed] Initial admin users provisioned: ${primaryAdminEmail}, ${secondaryAdminEmail}`);
  } else {
    // Preserve existing admin password, profile, and customizations on restart
    console.log(`[Seed] Active admin accounts found (${adminCheck.count}). Preserving credentials without overwrite.`);
  }

  // Seed Couriers: ONLY if table is empty
  const courierCount = db.prepare('SELECT count(*) as count FROM couriers').get().count;
  if (courierCount === 0) {
    const insertCourier = db.prepare(`
      INSERT OR IGNORE INTO couriers (name, code, logo, tracking_url_template, phone, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);

    const couriersList = [
      { name: 'Delhivery', code: 'delhivery', url: 'https://www.delhivery.com/track/package/{TRACKING_NUMBER}', phone: '+91 80698 56101' },
      { name: 'DTDC', code: 'dtdc', url: 'https://www.dtdc.in/tracking/shipment-tracking.asp?awbNo={TRACKING_NUMBER}', phone: '+91 73057 70577' },
      { name: 'Blue Dart', code: 'bluedart', url: 'https://www.bluedart.com/tracking?trackNumber={TRACKING_NUMBER}', phone: '1860 233 1234' },
      { name: 'India Post (Speed Post)', code: 'indiapost', url: 'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx?consignmentNo={TRACKING_NUMBER}', phone: '1800 266 6868' },
      { name: 'Ecom Express', code: 'ecomexpress', url: 'https://ecomexpress.in/tracking/?awb={TRACKING_NUMBER}', phone: '+91 83768 88888' },
      { name: 'Xpressbees', code: 'xpressbees', url: 'https://www.xpressbees.com/track?tracking_id={TRACKING_NUMBER}', phone: '+91 20491 16100' },
      { name: 'Shadowfax', code: 'shadowfax', url: 'https://tracker.shadowfax.in/#/track/{TRACKING_NUMBER}', phone: '+91 80681 72500' },
      { name: 'The Professional Couriers', code: 'professional', url: 'https://www.tpcindia.com/track.aspx?awb={TRACKING_NUMBER}', phone: '+91 22 2781 3309' },
      { name: 'Trackon Couriers', code: 'trackon', url: 'https://trackon.in/Tracking/Index?awb={TRACKING_NUMBER}', phone: '011 4686 9222' },
      { name: 'Amazon Shipping', code: 'amazon', url: 'https://track.amazon.in/tracking/{TRACKING_NUMBER}', phone: '1800 3000 9009' },
      { name: 'Ekart Logistics', code: 'ekart', url: 'https://ekartlogistics.com/shipmenttrack/{TRACKING_NUMBER}', phone: '+91 80 4900 8000' },
      { name: 'DHL Express', code: 'dhl', url: 'https://www.dhl.com/in-en/home/tracking.html?tracking-id={TRACKING_NUMBER}', phone: '1800 111 345' },
      { name: 'FedEx India', code: 'fedex', url: 'https://www.fedex.com/fedextrack/?trknbr={TRACKING_NUMBER}', phone: '1800 419 4339' }
    ];

    couriersList.forEach((c, idx) => {
      insertCourier.run(c.name, c.code, '', c.url, c.phone, idx + 1);
    });
    console.log('[Seed] Default couriers seeded successfully.');
  }

  // Seed Settings: STRICTLY INSERT OR IGNORE. NEVER OVERWRITE SAVED ADMIN SETTINGS!
  const defaultSettings = [
    { key: 'brand_name', value: 'TRENDYTOYZ' },
    { key: 'brand_tagline', value: 'Premium Toys & Play Essentials' },
    { key: 'brand_logo', value: '' },
    { key: 'support_email', value: 'trendytoys.info@gmail.com' },
    { key: 'support_phone', value: '+91 7718862274' },
    { key: 'whatsapp_number', value: '+91 7718862274' },
    { key: 'instagram_id', value: 'jgrl_co' },
    { key: 'instagram_url', value: 'https://instagram.com/jgrl_co' },
    { key: 'business_name', value: 'TRENDYTOYZ Retail Private Limited' },
    { key: 'business_address', value: 'Versova, Yari Road, Near D Mart, Andheri West' },
    { key: 'business_city', value: 'Mumbai' },
    { key: 'business_state', value: 'Maharashtra' },
    { key: 'business_pincode', value: '400061' },
    { key: 'business_phone', value: '+91 7718862274' },
    { key: 'business_email', value: 'trendytoys.info@gmail.com' },
    { key: 'gstin', value: '27DHHPJ9326M1ZQ' },

    // Return & Cancellation Policy Settings
    { key: 'cancellation_policy', value: 'Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.' },
    { key: 'damaged_item_reporting_enabled', value: 'true' },
    { key: 'damaged_item_window_hours', value: '48' },

    // Inventory & Alert Settings
    { key: 'low_stock_default_threshold', value: '5' },

    // Social & OAuth Settings
    { key: 'google_client_id', value: '' },
    { key: 'apple_client_id', value: '' },

    // Payment Gateway Settings
    { key: 'payment_gateway_provider', value: 'razorpay' },
    { key: 'razorpay_key_id', value: process.env.RAZORPAY_KEY_ID || 'rzp_test_To0voa1HArstTq' },
    { key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || 'MM9T1ek9RIBfBrRViW210oaw' },
    { key: 'phonepe_merchant_id', value: process.env.PHONEPE_MERCHANT_ID || '' },
    { key: 'phonepe_salt_key', value: process.env.PHONEPE_SALT_KEY || '' },
    { key: 'phonepe_salt_index', value: '1' },
    { key: 'online_payments_enabled', value: 'true' },

    // COD Settings
    { key: 'cod_enabled', value: 'true' },
    { key: 'cod_charge', value: '50' },
    { key: 'cod_min_order', value: '299' },
    { key: 'cod_max_order', value: '10000' },

    // Shipping Settings
    { key: 'standard_shipping_charge', value: '49' },
    { key: 'free_shipping_threshold', value: '799' },

    // General Settings
    { key: 'currency_symbol', value: '₹' },
    { key: 'tax_rate_default', value: '18' },

    // Email & Notification Settings
    { key: 'admin_notification_email', value: 'trendytoys.info@gmail.com' },
    { key: 'smtp_host', value: 'smtp.gmail.com' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: 'trendytoys.info@gmail.com' },
    { key: 'smtp_pass', value: '' },
    { key: 'email_order_confirmation_enabled', value: 'true' },
    { key: 'email_admin_alert_enabled', value: 'true' },
    { key: 'site_url', value: 'https://trendytoyz.com' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }
}

/**
 * STARTUP DATA INTEGRITY AUDIT
 * Logs exact records found in the persistent database to guarantee nothing is lost.
 */
function logDataIntegrityCheck() {
  try {
    const pCount = db.prepare("SELECT count(*) as total, sum(CASE WHEN is_deleted = 0 AND status = 'active' THEN 1 ELSE 0 END) as active, sum(CASE WHEN is_deleted = 1 OR is_archived = 1 OR status = 'archived' THEN 1 ELSE 0 END) as archived FROM products").get();
    const cCount = db.prepare("SELECT count(*) as total, sum(CASE WHEN is_deleted = 0 AND is_active = 1 THEN 1 ELSE 0 END) as active FROM categories").get();
    const oCount = db.prepare("SELECT count(*) as total, sum(CASE WHEN payment_status = 'CONFIRMED' THEN 1 ELSE 0 END) as paid FROM orders").get();
    const uCount = db.prepare("SELECT count(*) as total FROM users").get();
    const sCount = db.prepare("SELECT count(*) as total FROM settings").get();

    console.log('===================================================');
    console.log('🛡️  DATA INTEGRITY & PERSISTENCE STARTUP AUDIT:');
    console.log(`   Database Path: ${dbPath}`);
    console.log(`   • Products in DB:   ${pCount.total || 0} (Active: ${pCount.active || 0}, Archived: ${pCount.archived || 0})`);
    console.log(`   • Categories in DB: ${cCount.total || 0} (Active: ${cCount.active || 0})`);
    console.log(`   • Orders in DB:     ${oCount.total || 0} (Paid: ${oCount.paid || 0})`);
    console.log(`   • Customers/Users:  ${uCount.total || 0}`);
    console.log(`   • Settings in DB:   ${sCount.total || 0}`);
    console.log('   Status: All data persistently loaded from disk.');
    console.log('===================================================');
  } catch (err) {
    console.error('Integrity check error:', err.message);
  }
}

connectDb();

module.exports = dbProxy;
