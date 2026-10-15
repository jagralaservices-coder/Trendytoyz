const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const emailService = require('../services/emailService');
/**
 * Redirect /razorpay/checkout.js to official Razorpay checkout SDK URL
 */
router.get('/razorpay/checkout.js', (req, res) => {
  return res.redirect(301, 'https://checkout.razorpay.com/v1/checkout.js');
});


/**
 * Initialize Razorpay instance with environment credentials
 */
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    const error = new Error('Razorpay credentials are not configured in environment variables.');
    error.statusCode = 401;
    throw error;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
}

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency, key_id }
 * Minimum amount: 100 paise (₹1)
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate amount
    const amountInPaise = Math.round(Number(amount));
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 100 paise (₹1.00).'
      });
    }

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (authErr) {
      return res.status(401).json({
        success: false,
        error: authErr.message || 'Razorpay authentication failed.'
      });
    }

    const orderOptions = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt ? String(receipt).slice(0, 40) : `rcpt_${Date.now().toString().slice(-8)}`
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    return res.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('[Razorpay] Create order error:', err);

    if (err.statusCode === 401 || err.error?.code === 'BAD_REQUEST_ERROR' && err.error?.description?.includes('auth')) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay authentication failed. Please verify your Key ID and Key Secret.'
      });
    }

    const errorMessage = err.error?.description || err.message || 'Razorpay order creation failed.';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * STEP 3: BACKEND - Verify Payment Signature
 * Endpoint: POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
router.post('/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId // Optional: internal store order ID
    } = req.body;

    // Missing fields check: return 400
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for signature verification. Required: razorpay_order_id, razorpay_payment_id, razorpay_signature.'
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay Key Secret is not set in environment variables.'
      });
    }

    // Generate expected signature
    const textToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(textToSign)
      .digest('hex');

    // Compare signatures
    const isMatch = (generatedSignature === razorpay_signature);

    if (!isMatch) {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({
        success: false,
        error: 'Payment signature mismatch. Verification failed.'
      });
    }

    // If orderId is provided (matching an internal store order in database), mark as paid
    if (orderId) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (order) {
        db.prepare(`
          UPDATE orders SET
            payment_status = 'CONFIRMED',
            order_status = 'PAYMENT CONFIRMED',
            payment_gateway_ref = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(razorpay_payment_id, orderId);

        // Record entry in payments table
        db.prepare(`
          INSERT INTO payments (order_id, gateway, transaction_id, amount, status, payload)
          VALUES (?, 'RAZORPAY', ?, ?, 'SUCCESS', ?)
        `).run(orderId, razorpay_payment_id, order.total_amount, JSON.stringify(req.body));

        // Add to history
        db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
          orderId, 'PAYMENT CONFIRMED', `Razorpay Payment Verified. ID: ${razorpay_payment_id}`
        );

        // Dispatch email notifications
        try {
          emailService.sendOrderConfirmation(order);
          emailService.sendAdminOrderAlert(order);
        } catch (e) {
          console.error('Email dispatch error on payment confirmation:', e.message);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });
  } catch (err) {
    console.error('[Razorpay] Verify payment error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error occurred during payment verification.'
    });
  }
});

/**
 * Endpoint to safely fetch frontend config (Public Key ID only)
 */
router.get('/payment-config', (req, res) => {
  return res.json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID || ''
  });
});

module.exports = router;
