const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tracking?orderId=TTZ-xxx&identifier=phone_or_email
router.get('/', (req, res) => {
  try {
    const { orderId, identifier } = req.query;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Please enter Order ID.' });
    }

    const cleanOrderId = orderId.trim();
    let order;

    if (identifier && identifier.trim()) {
      const cleanId = identifier.trim().toLowerCase();
      order = db.prepare(`
        SELECT * FROM orders
        WHERE UPPER(id) = UPPER(?) AND (LOWER(customer_phone) LIKE ? OR LOWER(customer_email) = ?)
      `).get(cleanOrderId, `%${cleanId}%`, cleanId);
    } else {
      // Lookup directly by Order ID
      order = db.prepare(`
        SELECT * FROM orders
        WHERE UPPER(id) = UPPER(?)
      `).get(cleanOrderId);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'No order found matching the specified Order ID and Details.'
      });
    }

    const items = db.prepare('SELECT product_name, sku, quantity, price, total FROM order_items WHERE order_id = ?').all(order.id);
    const history = db.prepare('SELECT status, notes, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

    const isCancelled = order.order_status.toUpperCase().includes('CANCEL') || order.order_status.toUpperCase().includes('REJECT');

    let timeline = [];

    if (isCancelled) {
      timeline = [
        { key: 'PLACED', label: 'Order Placed', completed: true, current: false, timestamp: order.created_at },
        { 
          key: 'CANCELLED', 
          label: order.order_status === 'CANCELLED BY CUSTOMER' ? 'Cancelled by Customer' : 'Cancelled / Rejected', 
          completed: true, 
          current: true, 
          isCancelled: true,
          notes: order.cancellation_reason || 'Order was cancelled.',
          timestamp: history.length > 0 ? history[history.length - 1].created_at : order.updated_at || order.created_at
        }
      ];
    } else {
      // Canonical milestone stages
      const stages = [
        { key: 'PLACED', label: 'Order Placed', aliases: ['PENDING', 'ORDER PLACED', 'PLACED'] },
        { key: 'ACCEPTED', label: 'Order Accepted', aliases: ['ACCEPTED', 'CONFIRMED', 'COD CONFIRMED', 'PAYMENT CONFIRMED', 'PROCESSING'] },
        { key: 'PACKED', label: 'Packed & Ready', aliases: ['PACKED'] },
        { key: 'DISPATCHED', label: 'Dispatched / In Transit', aliases: ['DISPATCHED', 'SHIPPED', 'OUT FOR DELIVERY'] },
        { key: 'DELIVERED', label: 'Delivered', aliases: ['DELIVERED', 'COMPLETED'] }
      ];

      const currentStatusUpper = order.order_status.toUpperCase();
      let currentStageIdx = 0;

      stages.forEach((stage, sIdx) => {
        if (stage.aliases.some(a => currentStatusUpper.includes(a) || a === currentStatusUpper)) {
          currentStageIdx = Math.max(currentStageIdx, sIdx);
        }
      });

      timeline = stages.map((stage, idx) => {
        const isCompleted = idx <= currentStageIdx;
        const isCurrent = idx === currentStageIdx;

        // Try to find matching timestamp in history
        const matchedHistory = history.find(h => {
          const hStatusUpper = (h.status || '').toUpperCase();
          return stage.aliases.some(a => hStatusUpper.includes(a) || a === hStatusUpper);
        });

        return {
          key: stage.key,
          label: stage.label,
          completed: isCompleted,
          current: isCurrent,
          timestamp: matchedHistory ? matchedHistory.created_at : (isCompleted ? order.created_at : null)
        };
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_date: order.created_at,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone ? `${order.customer_phone.slice(0, 3)}****${order.customer_phone.slice(-3)}` : '',
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        total_amount: order.total_amount,
        courier_name: order.courier_name,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        dispatch_date: order.dispatch_date,
        estimated_delivery: order.estimated_delivery,
        cancellation_reason: order.cancellation_reason,
        items,
        history,
        timeline
      }
    });
  } catch (err) {
    console.error('Tracking query error:', err);
    res.status(500).json({ success: false, error: 'Failed to look up order tracking details.' });
  }
});

module.exports = router;
