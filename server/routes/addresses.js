const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/addresses (List saved user addresses)
router.get('/', authenticateToken, (req, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
    res.json({ success: true, addresses });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch addresses.' });
  }
});

// POST /api/addresses (Add Address)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, email, street_address, city, state, pincode, is_default } = req.body;
    if (!full_name || !phone || !street_address || !city || !state || !pincode) {
      return res.status(400).json({ success: false, error: 'All address fields are required.' });
    }

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const result = db.prepare(`
      INSERT INTO addresses (user_id, full_name, phone, email, street_address, city, state, pincode, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, full_name, phone, email || req.user.email, street_address, city, state, pincode, is_default ? 1 : 0);

    res.json({ success: true, message: 'Address saved successfully!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save address.' });
  }
});

// PUT /api/addresses/:id (Edit Address)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, email, street_address, city, state, pincode, is_default } = req.body;
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    db.prepare(`
      UPDATE addresses SET full_name = ?, phone = ?, email = ?, street_address = ?, city = ?, state = ?, pincode = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `).run(full_name, phone, email || req.user.email, street_address, city, state, pincode, is_default ? 1 : 0, req.params.id, req.user.id);

    res.json({ success: true, message: 'Address updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update address.' });
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Address deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete address.' });
  }
});

module.exports = router;
