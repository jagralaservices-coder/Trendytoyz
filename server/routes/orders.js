const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Dispatched/Final statuses where customer cancellation/return is strictly forbidden
const NON_CANCELLABLE_STATUSES = [
  'DISPATCHED',
  'SHIPPED',
  'OUT FOR DELIVERY',
  'DELIVERED',
  'COMPLETED'
];

// Helper to format full order with items and history
function formatOrder(order) {
  if (!order) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

  let parsedAddress = {};
  try {
    parsedAddress = JSON.parse(order.shipping_address);
  } catch (e) {
    parsedAddress = { street: order.shipping_address };
  }

  const normalizedStatus = (order.order_status || '').toUpperCase();
  const isDispatched = NON_CANCELLABLE_STATUSES.includes(normalizedStatus);
  const isCancellableByCustomer = !isDispatched && !normalizedStatus.includes('CANCEL') && !normalizedStatus.includes('RETURN');
  const isPendingAcceptance = ['ORDER PLACED', 'PAYMENT CONFIRMED', 'COD CONFIRMED', 'PENDING', 'PROCESSING'].includes(normalizedStatus);
  const isAccepted = ['ACCEPTED', 'PACKED', 'DISPATCHED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED'].includes(normalizedStatus);

  return {
    ...order,
    shipping_address: parsedAddress,
    items,
    history,
    is_dispatched: isDispatched,
    is_cancellable_by_customer: isCancellableByCustomer,
    is_pending_acceptance: isPendingAcceptance,
    is_accepted: isAccepted
  };
}

// Helper to get store business settings
function getStoreSettings() {
  const storeRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  storeRows.forEach(r => settings[r.key] = r.value);
  return {
    brand_name: settings.brand_name || 'TRENDYTOYZ',
    business_name: settings.business_name || settings.brand_name || 'TRENDYTOYZ Retail',
    business_address: settings.business_address || 'Versova, Yari Road, Near D Mart, Andheri West',
    business_city: settings.business_city || 'Mumbai',
    business_state: settings.business_state || 'Maharashtra',
    business_pincode: settings.business_pincode || '400061',
    business_phone: settings.business_phone || settings.support_phone || '+91 7718862274',
    business_email: settings.business_email || settings.support_email || 'trendytoys.info@gmail.com',
    gstin: settings.gstin || '27DHHPJ9326M1ZQ',
    cancellation_policy: settings.cancellation_policy || 'Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.',
    support_email: settings.support_email || 'trendytoys.info@gmail.com',
    support_phone: settings.support_phone || '+91 7718862274',
    instagram_id: settings.instagram_id || 'jgrl_co',
    instagram_url: settings.instagram_url || 'https://instagram.com/jgrl_co'
  };
}

// GET /api/orders/my-orders (Customer orders)
router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const formatted = orders.map(formatOrder);
    res.json({ success: true, orders: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch your orders.' });
  }
});

// GET /api/orders/my-orders/:id
router.get('/my-orders/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    res.json({ success: true, order: formatOrder(order) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order details.' });
  }
});

// POST /api/orders/cancel/:id (Customer Cancel - ONLY until marked Dispatched)
router.post('/cancel/:id', authenticateToken, (req, res) => {
  try {
    const { reason } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    const normalizedStatus = (order.order_status || '').toUpperCase();

    // STRICT CANCELLATION GUARD: Cannot cancel if order is already dispatched/shipped/delivered
    if (NON_CANCELLABLE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.'
      });
    }

    if (normalizedStatus.includes('CANCEL')) {
      return res.status(400).json({ success: false, error: 'This order is already cancelled.' });
    }

    const cancelReasonText = reason ? reason.trim() : 'Cancelled by customer before dispatch';

    // If prepaid, mark refund as initiated
    const isPrepaid = order.payment_method === 'ONLINE' || order.payment_status === 'CONFIRMED' || order.payment_status === 'PAID';
    const newPaymentStatus = isPrepaid ? 'REFUND INITIATED' : order.payment_status;

    db.prepare(`
      UPDATE orders SET
        order_status = 'Cancelled by Customer',
        cancellation_reason = ?,
        payment_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cancelReasonText, newPaymentStatus, order.id);

    // Restore Stock Quantity in products
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
    const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // Add status history record
    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      order.id,
      'Cancelled by Customer',
      `Order cancelled by customer before dispatch. Reason: ${cancelReasonText}${isPrepaid ? ' (Prepaid: Refund Initiated)' : ''}`
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.' + (isPrepaid ? ' Refund has been initiated for your payment.' : '')
    });
  } catch (err) {
    console.error('Customer cancel order error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

// GET /api/orders/admin/all (Admin view with filters & pagination)
router.get('/admin/all', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, paymentMethod, paymentStatus, search, page = 1, limit = 50, dateFrom, dateTo } = req.query;

    let conditions = [];
    let params = [];

    if (status) {
      if (status === 'PENDING_ACTIONS') {
        conditions.push("order_status IN ('ORDER PLACED', 'PAYMENT CONFIRMED', 'COD CONFIRMED', 'PENDING', 'PROCESSING')");
      } else {
        conditions.push('order_status = ?');
        params.push(status);
      }
    }
    if (paymentMethod) {
      conditions.push('payment_method = ?');
      params.push(paymentMethod);
    }
    if (paymentStatus) {
      conditions.push('payment_status = ?');
      params.push(paymentStatus);
    }
    if (dateFrom) {
      conditions.push('DATE(created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(created_at) <= ?');
      params.push(dateTo);
    }
    if (search) {
      conditions.push('(id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR courier_name LIKE ? OR tracking_number LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const orders = db.prepare(`
      SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const total = db.prepare(`SELECT count(*) as count FROM orders ${whereClause}`).get(...params).count;

    const formatted = orders.map(formatOrder);
    res.json({ success: true, orders: formatted, total, storeSettings: getStoreSettings() });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin orders.' });
  }
});

// GET /api/orders/admin/export-csv - Export orders to Excel/CSV
router.get('/admin/export-csv', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, paymentMethod, dateFrom, dateTo, search } = req.query;

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('order_status = ?');
      params.push(status);
    }
    if (paymentMethod) {
      conditions.push('payment_method = ?');
      params.push(paymentMethod);
    }
    if (dateFrom) {
      conditions.push('DATE(created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(created_at) <= ?');
      params.push(dateTo);
    }
    if (search) {
      conditions.push('(id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orders = db.prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC`).all(...params);

    let csv = "Order ID,Order Date,Customer Name,Phone,Email,Street Address,City,State,Pincode,Payment Mode,Payment Status,Order Status,Subtotal,Discount,Shipping,COD Charge,Grand Total,Courier Name,Tracking Number,Admin Notes\n";

    orders.forEach(o => {
      let addr = {};
      try { addr = JSON.parse(o.shipping_address); } catch (e) { addr = { street: o.shipping_address }; }

      const safe = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

      csv += [
        safe(o.id),
        safe(o.created_at),
        safe(o.customer_name),
        safe(o.customer_phone),
        safe(o.customer_email),
        safe(addr.street),
        safe(addr.city),
        safe(addr.state),
        safe(addr.pincode),
        safe(o.payment_method),
        safe(o.payment_status),
        safe(o.order_status),
        o.subtotal,
        o.discount_amount,
        o.shipping_charge,
        o.cod_charge,
        o.total_amount,
        safe(o.courier_name),
        safe(o.tracking_number),
        safe(o.admin_notes)
      ].join(',') + "\n";
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_export_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, error: 'Failed to export CSV.' });
  }
});

// GET /api/orders/admin/:id
router.get('/admin/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    res.json({ success: true, order: formatOrder(order), storeSettings: getStoreSettings() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order.' });
  }
});

// POST /api/orders/admin/:id/accept - FIRST ACTION: Admin Accepts Order
router.post('/admin/:id/accept', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    if (order.order_status.toUpperCase().includes('CANCEL')) {
      return res.status(400).json({ success: false, error: 'Cannot accept a cancelled order.' });
    }

    db.prepare(`
      UPDATE orders SET order_status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId);

    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId, 'Accepted', 'Order accepted by store admin. Fulfillment initiated.'
    );

    res.json({ success: true, message: `Order #${orderId} has been ACCEPTED successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to accept order.' });
  }
});

// POST /api/orders/admin/:id/cancel - Admin Cancels Order (requires reason dropdown + note)
router.post('/admin/:id/cancel', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason, notes } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Cancellation reason is required.' });
    }

    const fullReason = `${reason}${notes ? ` - ${notes}` : ''}`;
    const isPrepaid = order.payment_method === 'ONLINE' || order.payment_status === 'CONFIRMED' || order.payment_status === 'PAID';
    const newPaymentStatus = isPrepaid ? 'REFUND INITIATED' : order.payment_status;

    db.prepare(`
      UPDATE orders SET
        order_status = 'Cancelled by Admin',
        cancellation_reason = ?,
        payment_status = ?,
        admin_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullReason, newPaymentStatus, fullReason, orderId);

    // Restore Stock Quantity
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);
    const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // Add status history
    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId,
      'Cancelled by Admin',
      `Order cancelled by Admin. Reason: ${fullReason}${isPrepaid ? ' (Refund Initiated)' : ''}`
    );

    res.json({ success: true, message: `Order #${orderId} cancelled by Admin. Stock restored.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

// POST /api/orders/admin/:id/pack - Mark Packed
router.post('/admin/:id/pack', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    db.prepare(`
      UPDATE orders SET order_status = 'Packed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId);

    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId, 'Packed', 'Order items picked, verified and packed securely in tamper-evident packaging.'
    );

    res.json({ success: true, message: `Order #${orderId} marked as PACKED.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark packed.' });
  }
});

// POST /api/orders/admin/:id/dispatch - Add Courier/AWB and Mark Dispatched
router.post('/admin/:id/dispatch', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const { courier_name, tracking_number, tracking_url, estimated_delivery } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    if (!courier_name || !tracking_number) {
      return res.status(400).json({ success: false, error: 'Courier partner and AWB/Tracking number are required to dispatch.' });
    }

    db.prepare(`
      UPDATE orders SET
        courier_name = ?,
        tracking_number = ?,
        tracking_url = ?,
        estimated_delivery = ?,
        order_status = 'Dispatched',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      courier_name.trim(),
      tracking_number.trim(),
      tracking_url ? tracking_url.trim() : '',
      estimated_delivery || '',
      orderId
    );

    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId,
      'Dispatched',
      `Shipment handed over to ${courier_name}. AWB: ${tracking_number}${estimated_delivery ? ` | Est. Delivery: ${estimated_delivery}` : ''}`
    );

    res.json({
      success: true,
      message: `Order #${orderId} marked as DISPATCHED via ${courier_name}! Customer tracking is now active.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to dispatch order.' });
  }
});

// POST /api/orders/admin/:id/deliver - Mark Delivered
router.post('/admin/:id/deliver', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    // If COD, mark payment as CONFIRMED upon successful delivery
    const newPaymentStatus = order.payment_method === 'COD' ? 'CONFIRMED' : order.payment_status;

    db.prepare(`
      UPDATE orders SET
        order_status = 'Delivered',
        payment_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPaymentStatus, orderId);

    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId, 'Delivered', 'Order successfully delivered to customer.'
    );

    res.json({ success: true, message: `Order #${orderId} marked as DELIVERED.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark delivered.' });
  }
});

// PUT /api/orders/admin/:id/status (General status update fallback)
router.put('/admin/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { orderStatus, paymentStatus, adminNotes } = req.body;
    const orderId = req.params.id;

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!existing) return res.status(404).json({ success: false, error: 'Order not found.' });

    let updates = [];
    let params = [];

    if (orderStatus) {
      updates.push('order_status = ?');
      params.push(orderStatus);
    }
    if (paymentStatus) {
      updates.push('payment_status = ?');
      params.push(paymentStatus);
    }
    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(adminNotes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(orderId);

    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    if (orderStatus && orderStatus !== existing.order_status) {
      db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
        orderId, orderStatus, adminNotes || `Status updated to ${orderStatus} by Admin`
      );

      // Handle stock restoration if order was cancelled
      if (orderStatus.toUpperCase().includes('CANCEL') && !existing.order_status.toUpperCase().includes('CANCEL')) {
        const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
        for (const item of items) {
          updateStock.run(item.quantity, item.product_id);
        }
      }
    }

    res.json({ success: true, message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
});

// PUT /api/orders/admin/:id/tracking (Tracking details update)
router.put('/admin/:id/tracking', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { courier_name, tracking_number, tracking_url, estimated_delivery } = req.body;
    const orderId = req.params.id;

    db.prepare(`
      UPDATE orders SET
        courier_name = ?,
        tracking_number = ?,
        tracking_url = ?,
        estimated_delivery = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(courier_name || '', tracking_number || '', tracking_url || '', estimated_delivery || '', orderId);

    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId, 'Dispatched', `Tracking updated: ${courier_name || 'Courier'}, AWB: ${tracking_number || 'N/A'}`
    );

    res.json({ success: true, message: 'Tracking details saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update tracking details.' });
  }
});

// POST /api/orders/admin/bulk-labels - Return data for multiple shipping labels
router.post('/admin/bulk-labels', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one order for label generation.' });
    }

    const placeholders = orderIds.map(() => '?').join(',');
    const orders = db.prepare(`SELECT * FROM orders WHERE id IN (${placeholders})`).all(...orderIds);
    const formatted = orders.map(formatOrder);

    res.json({
      success: true,
      orders: formatted,
      store: getStoreSettings()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate bulk labels data.' });
  }
});

// GET /api/orders/invoice/:id (Public / Customer Invoice Data)
router.get('/invoice/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    res.json({
      success: true,
      order: formatOrder(order),
      store: getStoreSettings()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice.' });
  }
});

module.exports = router;
