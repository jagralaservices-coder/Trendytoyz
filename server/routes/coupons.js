const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/coupons (Admin list)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch coupons.' });
  }
});

// POST /api/coupons (Admin Add)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ success: false, error: 'Coupon code, type and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM coupons WHERE UPPER(code) = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Coupon code already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      cleanCode, discount_type, parseFloat(discount_value),
      parseFloat(min_order_amount || 0), parseFloat(max_discount || 0),
      parseInt(usage_limit || 100), is_active ? 1 : 0
    );

    res.json({ success: true, message: 'Coupon created successfully!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create coupon.' });
  }
});

// PUT /api/coupons/:id (Admin Edit)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active } = req.body;
    const cleanCode = code.trim().toUpperCase();

    db.prepare(`
      UPDATE coupons SET
        code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?,
        max_discount = ?, usage_limit = ?, is_active = ?
      WHERE id = ?
    `).run(
      cleanCode, discount_type, parseFloat(discount_value),
      parseFloat(min_order_amount || 0), parseFloat(max_discount || 0),
      parseInt(usage_limit || 100), is_active ? 1 : 0, req.params.id
    );

    res.json({ success: true, message: 'Coupon updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update coupon.' });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete coupon.' });
  }
});

module.exports = router;
