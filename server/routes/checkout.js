const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Helper to get store settings map
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  rows.forEach(r => map[r.key] = r.value);
  return map;
}

// Helper to dispatch both customer confirmation and admin new order alert emails
async function triggerOrderEmails(orderId) {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(order.shipping_address || '{}');
    } catch (e) {
      parsedAddress = { street: order.shipping_address || '' };
    }

    const customerDetails = {
      name: order.customer_name || 'Customer',
      phone: order.customer_phone || '',
      email: order.customer_email || '',
      address: parsedAddress.street || parsedAddress.address || '',
      city: parsedAddress.city || '',
      state: parsedAddress.state || '',
      pincode: parsedAddress.pincode || ''
    };

    const settings = getSettings();
    const liveUrl = settings.site_url || 'https://jgrl.co';

    // 1. Send Order Confirmation Email to Customer
    emailService.sendCustomerOrderConfirmation({ order, items, customerDetails, liveUrl })
      .catch(err => console.error('[EmailService] Customer confirmation error:', err.message));

    // 2. Send New Order Received Alert to Store Owner / Admin
    emailService.sendAdminNewOrderAlert({ order, items, customerDetails, liveUrl })
      .catch(err => console.error('[EmailService] Admin order alert error:', err.message));
  } catch (err) {
    console.error('[EmailService] triggerOrderEmails error:', err.message);
  }
}

// Generate unique order ID format: TTZ-YYYYMMDD-XXXX
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const count = db.prepare("SELECT count(*) as c FROM orders WHERE id LIKE ?").get(`TTZ-${dateStr}-%`).c;
  const seq = String(count + 1).padStart(4, '0');
  return `TTZ-${dateStr}-${seq}${randomSuffix.toString().slice(-2)}`;
}

// Validate Coupon Endpoint
router.post('/validate-coupon', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code is required.' });

    const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code.trim());
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code.' });
    }

    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        error: `Coupon code '${coupon.code}' requires a minimum order amount of ₹${coupon.min_order_amount}.`
      });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, error: 'This coupon limit has been reached.' });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    if (discount > subtotal) discount = subtotal;

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        calculated_discount: Math.round(discount)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error validating coupon.' });
  }
});

// Calculate Checkout Totals
router.post('/calculate-summary', (req, res) => {
  try {
    const { items, paymentMethod, couponCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' });
    }

    const settings = getSettings();
    let subtotal = 0;

    // Verify current prices from DB
    const validatedItems = items.map(item => {
      const p = db.prepare('SELECT id, name, sku, selling_price, stock_quantity, is_free_shipping, shipping_charge FROM products WHERE id = ?').get(item.id);
      if (!p) throw new Error(`Product ${item.name} not found.`);
      if (p.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${p.name}". Available: ${p.stock_quantity}`);
      }
      const itemTotal = p.selling_price * item.quantity;
      subtotal += itemTotal;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.selling_price,
        quantity: item.quantity,
        total: itemTotal,
        is_free_shipping: p.is_free_shipping === 1,
        shipping_charge: parseFloat(p.shipping_charge || 0)
      };
    });

    const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || 799);
    const standardShipping = parseFloat(settings.standard_shipping_charge || 49);

    // If all items have free shipping, shipping is ₹0
    const allFreeShipping = validatedItems.length > 0 && validatedItems.every(i => i.is_free_shipping);
    const maxCustomShipping = Math.max(0, ...validatedItems.map(i => i.shipping_charge || 0));

    let shippingCharge = 0;
    if (!allFreeShipping) {
      if (maxCustomShipping > 0) {
        shippingCharge = maxCustomShipping;
      } else {
        shippingCharge = subtotal >= freeShippingThreshold ? 0 : standardShipping;
      }
    }

    let codCharge = 0;
    if (paymentMethod === 'COD') {
      codCharge = parseFloat(settings.cod_charge || 50);
    }

    let couponDiscount = 0;
    if (couponCode) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(couponCode.trim());
      if (coupon && subtotal >= (coupon.min_order_amount || 0)) {
        if (coupon.discount_type === 'percentage') {
          couponDiscount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount && couponDiscount > coupon.max_discount) couponDiscount = coupon.max_discount;
        } else {
          couponDiscount = coupon.discount_value;
        }
      }
    }

    couponDiscount = Math.round(couponDiscount);
    if (couponDiscount > subtotal) couponDiscount = subtotal;

    const grandTotal = Math.max(0, subtotal - couponDiscount + shippingCharge + codCharge);

    res.json({
      success: true,
      subtotal,
      shippingCharge,
      codCharge,
      couponDiscount,
      grandTotal: Math.round(grandTotal),
      freeShippingThreshold,
      items: validatedItems
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Error calculating summary.' });
  }
});

// Create Order (COD or Online) - Mandatory Sign-in Required
router.post('/place-order', optionalAuth, async (req, res) => {
  try {
    const {
      customerDetails,
      items,
      paymentMethod,
      couponCode
    } = req.body;

    // Mandatory Authentication Check: Customer MUST be signed in
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        error: 'Order karne ke liye Sign In compulsory hai. Please Sign In to complete your purchase and easily access your order history & live tracking.'
      });
    }

    const userId = req.user.id;
    const settings = getSettings();

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty. Please add items to cart before checkout.' });
    }

    // Validate customer details
    if (!customerDetails || typeof customerDetails !== 'object') {
      return res.status(400).json({ success: false, error: 'Customer details are required.' });
    }

    const customerName = String(customerDetails.name || '').trim();
    const customerPhone = String(customerDetails.phone || '').trim();
    const customerEmail = String(customerDetails.email || req.user.email || '').trim();
    const customerAddress = String(customerDetails.address || '').trim();
    const customerCity = String(customerDetails.city || '').trim();
    const customerState = String(customerDetails.state || '').trim();
    const customerPincode = String(customerDetails.pincode || '').trim();

    if (!customerName || !customerPhone || !customerAddress || !customerPincode) {
      return res.status(400).json({
        success: false,
        error: 'Please complete all required fields: Full Name, Phone Number, Delivery Address, and Pincode.'
      });
    }

    // Check stock & calculate subtotal
    let subtotal = 0;
    const itemsToOrder = [];
    for (const item of items) {
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
      if (!p) {
        return res.status(400).json({ success: false, error: `Product ID ${item.id} not found.` });
      }
      if (p.stock_quantity < item.quantity) {
        return res.status(400).json({ success: false, error: `Product "${p.name}" is out of stock or requested quantity exceeds available stock (${p.stock_quantity} left).` });
      }
      const itemTotal = p.selling_price * item.quantity;
      subtotal += itemTotal;
      itemsToOrder.push({
        product: p,
        quantity: item.quantity,
        price: p.selling_price,
        variant: item.variant || '',
        total: itemTotal
      });
    }

    // COD Validation
    if (paymentMethod === 'COD') {
      if (settings.cod_enabled !== 'true') {
        return res.status(400).json({ success: false, error: 'Cash on Delivery is currently unavailable.' });
      }
      const codIneligible = itemsToOrder.find(item => item.product.is_cod_available === 0);
      if (codIneligible) {
        return res.status(400).json({
          success: false,
          error: `Cash on Delivery is not available for "${codIneligible.product.name}". Please choose Online Payment.`
        });
      }
      const minCod = parseFloat(settings.cod_min_order || 0);
      const maxCod = parseFloat(settings.cod_max_order || 100000);
      if (subtotal < minCod || subtotal > maxCod) {
        return res.status(400).json({ success: false, error: `COD is available for order values between ₹${minCod} and ₹${maxCod}.` });
      }
    }

    // Charges calculation
    const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || 799);
    const standardShipping = parseFloat(settings.standard_shipping_charge || 49);

    const allFreeShipping = itemsToOrder.length > 0 && itemsToOrder.every(i => i.product.is_free_shipping === 1);
    const maxCustomShipping = Math.max(0, ...itemsToOrder.map(i => parseFloat(i.product.shipping_charge || 0)));

    let shippingCharge = 0;
    if (!allFreeShipping) {
      if (maxCustomShipping > 0) {
        shippingCharge = maxCustomShipping;
      } else {
        shippingCharge = subtotal >= freeShippingThreshold ? 0 : standardShipping;
      }
    }
    const codCharge = paymentMethod === 'COD' ? parseFloat(settings.cod_charge || 50) : 0;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(couponCode.trim());
      if (coupon && subtotal >= (coupon.min_order_amount || 0)) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount && discountAmount > coupon.max_discount) discountAmount = coupon.max_discount;
        } else {
          discountAmount = coupon.discount_value;
        }
        // Increment coupon use count
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
      }
    }

    discountAmount = Math.round(discountAmount);
    const totalAmount = Math.round(Math.max(0, subtotal - discountAmount + shippingCharge + codCharge));

    const orderId = generateOrderId();
    const orderStatus = paymentMethod === 'COD' ? 'COD CONFIRMED' : 'ORDER PLACED';
    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PENDING';

    const shippingAddressJson = JSON.stringify({
      street: customerAddress,
      city: customerCity,
      state: customerState,
      pincode: customerPincode
    });

    // Start DB Transaction for atomic order creation & stock deduction
    const createOrderTx = db.transaction(() => {
      // Insert Order
      db.prepare(`
        INSERT INTO orders (
          id, user_id, customer_name, customer_phone, customer_email, shipping_address,
          subtotal, discount_amount, shipping_charge, cod_charge, total_amount,
          payment_method, payment_status, order_status
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        orderId, userId, customerName, customerPhone, customerEmail, shippingAddressJson,
        subtotal, discountAmount, shippingCharge, codCharge, totalAmount,
        paymentMethod, paymentStatus, orderStatus
      );

      // Insert Order Items & Deduct Stock
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, sku, price, quantity, variant, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStock = db.prepare(`
        UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
      `);

      for (const item of itemsToOrder) {
        insertItem.run(orderId, item.product.id, item.product.name, item.product.sku, item.price, item.quantity, item.variant, item.total);
        updateStock.run(item.quantity, item.product.id);
      }

      // Add status history
      db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
        orderId, orderStatus, paymentMethod === 'COD' ? 'Order placed via Cash on Delivery' : 'Online order initialized'
      );
    });

    createOrderTx();

    if (paymentMethod === 'COD') {
      // Trigger order confirmation email to customer & new order notification to store owner
      triggerOrderEmails(orderId);

      res.json({
        success: true,
        orderId,
        paymentMethod: 'COD',
        message: 'Your COD order has been successfully placed.',
        totalAmount
      });
    } else {
      // Prepare Online Payment Gateway Payload (Razorpay Standard Web Checkout)
      const razorpayKey = process.env.RAZORPAY_KEY_ID || settings.razorpay_key_id;
      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || settings.razorpay_key_secret;
      const amountInPaise = Math.round(totalAmount * 100);

      let razorpayOrderId = null;
      if (razorpayKey && razorpaySecret) {
        try {
          const Razorpay = require('razorpay');
          const rzp = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });
          const rzpOrder = await rzp.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: String(orderId).slice(0, 40)
          });
          razorpayOrderId = rzpOrder.id;
          console.log(`[Razorpay] Created order ${razorpayOrderId} for store order #${orderId}`);
        } catch (rzpErr) {
          console.error('[Razorpay] Orders.create error:', rzpErr.message || rzpErr);
        }
      }

      res.json({
        success: true,
        orderId,
        paymentMethod: 'ONLINE',
        amount: amountInPaise, // In paise for Razorpay
        currency: 'INR',
        razorpayKey,
        razorpayOrderId,
        customerName,
        customerEmail,
        customerPhone,
        message: 'Proceeding to secure online payment gateway.'
      });
    }
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error processing order.' });
  }
});

// Server-side Online Payment Verification Endpoint
router.post('/verify-payment', (req, res) => {
  try {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const settings = getSettings();
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || settings.razorpay_key_secret;

    // Validate signature fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required signature verification fields.'
      });
    }

    if (!razorpaySecret) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay secret key not configured.'
      });
    }

    // Verify HMAC-SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValidSignature = (expectedSignature === razorpay_signature);

    if (!isValidSignature) {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
    }

    // Update Order Payment Status
    db.prepare(`
      UPDATE orders SET
        payment_status = 'CONFIRMED',
        order_status = 'PAYMENT CONFIRMED',
        payment_gateway_ref = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(razorpay_payment_id || `PAY_${Date.now()}`, orderId);

    // Record Payment Entry
    db.prepare(`
      INSERT INTO payments (order_id, gateway, transaction_id, amount, status, payload)
      VALUES (?, 'ONLINE', ?, ?, 'SUCCESS', ?)
    `).run(orderId, razorpay_payment_id || `PAY_${Date.now()}`, order.total_amount, JSON.stringify(req.body));

    // Add Order Status History
    db.prepare('INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)').run(
      orderId, 'PAYMENT CONFIRMED', `Online payment verified. Ref: ${razorpay_payment_id || 'ONLINE_TXN'}`
    );

    // Trigger order confirmation email to customer & new order notification to store owner
    triggerOrderEmails(orderId);

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully!',
      orderId
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, error: 'Payment verification failed.' });
  }
});

module.exports = router;
