const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalSales = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'CANCELLED'").get().total;
    const todaySales = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'CANCELLED' AND DATE(created_at) = DATE('now')").get().total;
    const thisWeekSales = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'CANCELLED' AND created_at >= DATE('now', '-7 days')").get().total;
    const thisMonthSales = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'CANCELLED' AND created_at >= DATE('now', 'start of month')").get().total;

    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
    const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')").get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status IN ('ORDER PLACED', 'PAYMENT CONFIRMED', 'COD CONFIRMED')").get().count;
    const processingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'PROCESSING'").get().count;
    const shippedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'SHIPPED'").get().count;
    const deliveredOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'DELIVERED'").get().count;
    const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'CANCELLED'").get().count;

    const codOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_method = 'COD'").get().count;
    const onlineOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_method = 'ONLINE'").get().count;
    const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'PENDING' AND order_status != 'CANCELLED'").get().count;

    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const lowStockProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold").get().count;

    // Charts Data: Sales by Last 7 Days
    const dailySalesRaw = db.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total_amount), 0) as sales, COUNT(*) as orders
      FROM orders
      WHERE order_status != 'CANCELLED' AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Category Sales Distribution
    const categorySales = db.prepare(`
      SELECT c.name as category, COALESCE(SUM(oi.total), 0) as sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status != 'CANCELLED'
      GROUP BY c.id
    `).all();

    // Order Status Distribution
    const statusDistribution = db.prepare(`
      SELECT order_status as status, COUNT(*) as count
      FROM orders
      GROUP BY order_status
    `).all();

    // Top Selling Products
    const topProducts = db.prepare(`
      SELECT p.name, p.sku, SUM(oi.quantity) as sold_qty, SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status != 'CANCELLED'
      GROUP BY p.id
      ORDER BY sold_qty DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      metrics: {
        totalSales,
        todaySales,
        thisWeekSales,
        thisMonthSales,
        totalOrders,
        todayOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        codOrders,
        onlineOrders,
        pendingPayments,
        totalCustomers,
        lowStockProducts
      },
      charts: {
        dailySales: dailySalesRaw,
        categorySales,
        statusDistribution,
        topProducts
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics.' });
  }
});

// GET /api/admin/customers (List Customers)
router.get('/customers', authenticateToken, requireAdmin, (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.user_id = u.id AND o.order_status != 'CANCELLED') as total_spend
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.id DESC
    `).all();

    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer directory.' });
  }
});

// PUT /api/admin/customers/:id/status (Block / Unblock Customer)
router.put('/customers/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'blocked'
    db.prepare('UPDATE users SET status = ? WHERE id = ? AND role = "customer"').run(status, req.params.id);
    res.json({ success: true, message: `Customer status changed to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update customer status.' });
  }
});

// GET /api/admin/reports (Generate analytical reports CSV string)
router.get('/reports', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { type } = req.query; // 'sales' | 'orders' | 'inventory' | 'customers'

    if (type === 'inventory') {
      const rows = db.prepare(`
        SELECT p.sku, p.name, c.name as category, p.purchase_cost, p.selling_price, p.stock_quantity, p.low_stock_threshold
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.stock_quantity ASC
      `).all();

      let csv = "SKU,Product Name,Category,Purchase Cost,Selling Price,Stock Quantity,Low Stock Threshold\n";
      rows.forEach(r => {
        csv += `"${r.sku}","${r.name.replace(/"/g, '""')}","${r.category}",${r.purchase_cost},${r.selling_price},${r.stock_quantity},${r.low_stock_threshold}\n`;
      });
      return res.json({ success: true, filename: 'inventory_report.csv', csv });
    }

    // Default Sales Report
    const rows = db.prepare(`
      SELECT o.id, o.created_at, o.customer_name, o.customer_phone, o.payment_method, o.payment_status, o.order_status, o.total_amount
      FROM orders o
      ORDER BY o.created_at DESC
    `).all();

    let csv = "Order ID,Order Date,Customer Name,Phone,Payment Method,Payment Status,Order Status,Total Amount (INR)\n";
    rows.forEach(r => {
      csv += `"${r.id}","${r.created_at}","${r.customer_name.replace(/"/g, '""')}","${r.customer_phone}","${r.payment_method}","${r.payment_status}","${r.order_status}",${r.total_amount}\n`;
    });

    res.json({ success: true, filename: 'sales_orders_report.csv', csv });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate report.' });
  }
});

module.exports = router;
