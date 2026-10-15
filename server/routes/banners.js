const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/banners (Public active banners)
router.get('/', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC, id DESC').all();
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch banners.' });
  }
});

// GET /api/banners/admin (Admin view all)
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners ORDER BY display_order ASC, id DESC').all();
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin banners.' });
  }
});

// POST /api/banners (Admin Add)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, subtitle, image_url, button_text, button_url, display_order, is_active } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ success: false, error: 'Banner title and image URL are required.' });
    }

    const result = db.prepare(`
      INSERT INTO banners (title, subtitle, image_url, button_text, button_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle || '', image_url, button_text || 'Shop Now', button_url || '/shop', display_order || 0, is_active ? 1 : 0);

    res.json({ success: true, message: 'Banner added successfully!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add banner.' });
  }
});

// PUT /api/banners/:id (Admin Edit)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, subtitle, image_url, button_text, button_url, display_order, is_active } = req.body;

    db.prepare(`
      UPDATE banners SET title = ?, subtitle = ?, image_url = ?, button_text = ?, button_url = ?, display_order = ?, is_active = ?
      WHERE id = ?
    `).run(title, subtitle || '', image_url, button_text || 'Shop Now', button_url || '/shop', display_order || 0, is_active ? 1 : 0, req.params.id);

    res.json({ success: true, message: 'Banner updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update banner.' });
  }
});

// DELETE /api/banners/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Banner deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete banner.' });
  }
});

module.exports = router;
