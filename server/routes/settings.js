const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

// GET /api/settings/public (Safe settings for client app)
router.get('/public', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    // Filter out private keys
    const publicSettings = {
      brand_name: settings.brand_name || 'TRENDYTOYZ',
      brand_tagline: settings.brand_tagline || 'Premium Toys & Play Essentials',
      brand_logo: settings.brand_logo || '',
      support_email: settings.support_email || 'trendytoys.info@gmail.com',
      support_phone: settings.support_phone || '+91 7718862274',
      whatsapp_number: settings.whatsapp_number || '+91 7718862274',
      instagram_id: settings.instagram_id || 'jgrl_co',
      instagram_url: settings.instagram_url || 'https://instagram.com/jgrl_co',
      business_address: settings.business_address || '',
      gstin: settings.gstin || '',
      currency_symbol: settings.currency_symbol || '₹',
      cod_enabled: settings.cod_enabled === 'true',
      cod_charge: parseFloat(settings.cod_charge || 50),
      cod_min_order: parseFloat(settings.cod_min_order || 299),
      cod_max_order: parseFloat(settings.cod_max_order || 10000),
      standard_shipping_charge: parseFloat(settings.standard_shipping_charge || 49),
      free_shipping_threshold: parseFloat(settings.free_shipping_threshold || 799),
      payment_gateway_provider: settings.payment_gateway_provider || 'razorpay',
      razorpay_key_id: settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      online_payments_enabled: settings.online_payments_enabled === 'true',
      google_client_id: '',
      apple_client_id: ''
    };

    res.json({ success: true, settings: publicSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch public settings.' });
  }
});

// GET /api/settings/admin (All settings for admin panel)
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin settings.' });
  }
});

// PUT /api/settings/admin (Update settings)
router.put('/admin', authenticateToken, requireAdmin, (req, res) => {
  try {
    const settingsObj = req.body; // Key-Value pair map
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');

    const updateTx = db.transaction(() => {
      for (const [key, val] of Object.entries(settingsObj)) {
        upsert.run(key, String(val));
      }
    });

    updateTx();

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to save settings.' });
  }
});

// POST /api/settings/test-email (Test SMTP connection and send a test email)
router.post('/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { testEmail } = req.body;
    const recipient = testEmail || req.user.email || 'trendytoys.info@gmail.com';

    const result = await emailService.sendTestEmail(recipient);
    if (result.success) {
      return res.json({
        success: true,
        delivered: result.delivered,
        simulated: result.simulated,
        message: result.delivered 
          ? `Test email sent successfully to ${recipient} via SMTP!` 
          : `SMTP credentials not yet active. Mock email logged to server console.`
      });
    } else {
      return res.status(400).json({ success: false, error: result.error || 'Failed to send test email.' });
    }
  } catch (err) {
    console.error('Test email route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error executing SMTP test.' });
  }
});

module.exports = router;
