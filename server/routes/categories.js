const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/categories (Public)
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active' AND (p.is_deleted = 0 OR p.is_deleted IS NULL)) as product_count
      FROM categories c
      WHERE (c.is_deleted = 0 OR c.is_deleted IS NULL) AND c.is_active = 1
      ORDER BY c.display_order ASC, c.name ASC
    `).all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// GET /api/categories/admin (Admin)
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? '1=1' : '(c.is_deleted = 0 OR c.is_deleted IS NULL)';
    const categories = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND (p.is_deleted = 0 OR p.is_deleted IS NULL)) as product_count
      FROM categories c
      WHERE ${filter}
      ORDER BY c.display_order ASC, c.id DESC
    `).all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin categories.' });
  }
});

// POST /api/categories (Admin Add)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, image, display_order, is_active } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Category name is required.' });

    let baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'category';
    let slug = baseSlug;
    let counter = 1;
    while (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, image, display_order, is_active, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(name.trim(), slug, description || '', image || '', Number(display_order) || 0, is_active ? 1 : 0);

    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, message: 'Category added successfully!', category: newCategory, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Add category error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to add category.' });
  }
});

// PUT /api/categories/:id (Admin Edit)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, image, display_order, is_active } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Category name is required.' });

    let baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `category-${req.params.id}`;
    let slug = baseSlug;

    // Check if slug conflicts with another category
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, req.params.id);
    if (existing) {
      slug = `${baseSlug}-${req.params.id}`;
    }

    const result = db.prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, display_order = ?, is_active = ?, is_deleted = 0
      WHERE id = ?
    `).run(name.trim(), slug, description || '', image || '', Number(display_order) || 0, is_active ? 1 : 0, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category updated successfully!' });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id (Admin Safe Soft Delete)
// CRITICAL: Never delete customer order history!
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const categoryId = req.params.id;
    const cat = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(categoryId);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found or already deleted.' });
    }

    const softDeleteTx = db.transaction(() => {
      db.prepare(`
        UPDATE categories SET is_deleted = 1, is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(categoryId);

      db.prepare(`
        UPDATE products SET is_archived = 1, status = 'archived' WHERE category_id = ?
      `).run(categoryId);
    });

    softDeleteTx();
    res.json({ success: true, message: `Category "${cat.name}" archived safely. Associated products archived.` });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete category.' });
  }
});

// POST /api/categories/:id/restore (Admin Restore)
router.post('/:id/restore', authenticateToken, requireAdmin, (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = db.prepare(`
      UPDATE categories SET is_deleted = 0, is_active = 1, deleted_at = NULL WHERE id = ?
    `).run(categoryId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category restored successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to restore category.' });
  }
});

module.exports = router;
