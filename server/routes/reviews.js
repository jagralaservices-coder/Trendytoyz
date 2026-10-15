const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/reviews/admin (Admin list)
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.id DESC
    `).all();
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
  }
});

// POST /api/reviews (Submit review with rating, comment, and image upload)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { product_id, rating, comment, image_url } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ success: false, error: 'Product ID and star rating are required.' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

    // Check if customer has placed an order for this product
    const purchased = db.prepare(`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ?
    `).get(req.user.id, product_id);

    const isVerifiedBuyer = purchased ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment, image_url, is_verified_buyer, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(
      product_id,
      req.user.id,
      req.user.name || 'Valued Customer',
      numericRating,
      comment ? comment.trim() : '',
      image_url || '',
      isVerifiedBuyer
    );

    res.json({
      success: true,
      message: 'Thank you! Your review has been posted successfully.',
      reviewId: result.lastInsertRowid,
      is_verified_buyer: isVerifiedBuyer
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit review.' });
  }
});

// PUT /api/reviews/admin/:id/status (Admin Moderate Review)
router.put('/admin/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'hidden'
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, message: `Review status changed to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to moderate review.' });
  }
});

// DELETE /api/reviews/admin/:id
router.delete('/admin/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete review.' });
  }
});

module.exports = router;
