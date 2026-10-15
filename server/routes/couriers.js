const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/couriers - List active couriers for shipping dropdown
router.get('/', (req, res) => {
  try {
    const couriers = db.prepare('SELECT * FROM couriers WHERE is_active = 1 ORDER BY display_order ASC, name ASC').all();
    res.json({ success: true, couriers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch couriers.' });
  }
});

// GET /api/couriers/admin - List all couriers for Admin configuration
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const couriers = db.prepare('SELECT * FROM couriers ORDER BY display_order ASC, id ASC').all();
    res.json({ success: true, couriers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch couriers for admin.' });
  }
});

// POST /api/couriers - Add a new courier partner
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, logo, tracking_url_template, phone, is_active, display_order } = req.body;

    if (!name || !tracking_url_template) {
      return res.status(400).json({ success: false, error: 'Courier name and Tracking URL template are required.' });
    }

    const cleanCode = (code || name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 30);

    const result = db.prepare(`
      INSERT INTO couriers (name, code, logo, tracking_url_template, phone, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      cleanCode,
      logo || '',
      tracking_url_template.trim(),
      phone || '',
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      parseInt(display_order || 0)
    );

    const newCourier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, message: 'Courier partner added successfully!', courier: newCourier });
  } catch (err) {
    console.error('Create courier error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create courier partner.' });
  }
});

// PUT /api/couriers/:id - Update an existing courier
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, code, logo, tracking_url_template, phone, is_active, display_order } = req.body;
    const { id } = req.params;

    if (!name || !tracking_url_template) {
      return res.status(400).json({ success: false, error: 'Courier name and Tracking URL template are required.' });
    }

    db.prepare(`
      UPDATE couriers SET
        name = ?,
        code = ?,
        logo = ?,
        tracking_url_template = ?,
        phone = ?,
        is_active = ?,
        display_order = ?
      WHERE id = ?
    `).run(
      name.trim(),
      code || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      logo || '',
      tracking_url_template.trim(),
      phone || '',
      is_active ? 1 : 0,
      parseInt(display_order || 0),
      id
    );

    const updated = db.prepare('SELECT * FROM couriers WHERE id = ?').get(id);
    res.json({ success: true, message: 'Courier updated successfully!', courier: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update courier.' });
  }
});

// PATCH /api/couriers/:id/toggle - Quick toggle active status
router.patch('/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
  try {
    const courier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(req.params.id);
    if (!courier) return res.status(404).json({ success: false, error: 'Courier not found.' });

    const newStatus = courier.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE couriers SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

    res.json({ success: true, message: `Courier is now ${newStatus === 1 ? 'Active' : 'Inactive'}.`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle courier status.' });
  }
});

// DELETE /api/couriers/:id - Delete a courier
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM couriers WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Courier partner deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete courier partner.' });
  }
});

module.exports = router;
