const nodemailer = require('nodemailer');
const db = require('../db');

/**
 * Helper to fetch store settings from DB
 */
function getEmailConfig() {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    const smtpHost = process.env.SMTP_HOST || settings.smtp_host || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || settings.smtp_port || '587', 10);
    const smtpUser = process.env.SMTP_USER || settings.smtp_user || process.env.ADMIN_EMAIL || 'trendytoys.info@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || settings.smtp_pass || '';
    const senderName = settings.brand_name || 'TRENDYTOYZ Store';
    const senderEmail = settings.support_email || settings.business_email || smtpUser;
    const adminAlertEmail = settings.admin_notification_email || process.env.ADMIN_EMAIL || 'trendytoys.info@gmail.com';

    return {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      senderName,
      senderEmail,
      adminAlertEmail,
      brandName: settings.brand_name || 'TRENDYTOYZ',
      supportPhone: settings.business_phone || settings.support_phone || '+91 7718862274',
      instagramId: settings.instagram_id || 'jgrl_co',
      instagramUrl: settings.instagram_url || 'https://instagram.com/jgrl_co',
      hasCredentials: Boolean(smtpUser && smtpPass)
    };
  } catch (err) {
    console.error('Error reading email config:', err);
    return {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'trendytoys.info@gmail.com',
      smtpPass: '',
      senderName: 'TRENDYTOYZ',
      senderEmail: 'trendytoys.info@gmail.com',
      adminAlertEmail: 'trendytoys.info@gmail.com',
      brandName: 'TRENDYTOYZ',
      supportPhone: '+91 7718862274',
      instagramId: 'jgrl_co',
      instagramUrl: 'https://instagram.com/jgrl_co',
      hasCredentials: false
    };
  }
}

/**
 * Creates reusable nodemailer transporter
 */
function getTransporter(config) {
  if (!config.hasCredentials) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * 1. Send Order Confirmation Email to Customer
 */
async function sendCustomerOrderConfirmation({ order, items, customerDetails, liveUrl }) {
  const config = getEmailConfig();
  const recipientEmail = customerDetails.email || order.customer_email;

  if (!recipientEmail) {
    console.log(`[Email] Customer order #${order.id} has no email address. Skipping customer email.`);
    return { success: false, reason: 'No customer email' };
  }

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; font-weight: bold;">
        ${item.product?.name || item.product_name}
        ${item.variant ? `<br><span style="font-size: 11px; color: #64748b; font-weight: normal;">Variant: ${item.variant}</span>` : ''}
        <br><span style="font-size: 11px; color: #94a3b8; font-weight: normal;">SKU: ${item.product?.sku || item.sku || 'N/A'}</span>
      </td>
      <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #334155;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #334155;">₹${(item.price || item.product?.selling_price || 0).toLocaleString('en-IN')}</td>
      <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a;">₹${(item.total || (item.price * item.quantity) || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const trackingLink = `${liveUrl || 'https://jgrl.co'}/track?orderId=${encodeURIComponent(order.id)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmed - ${order.id}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                    ${config.brandName}
                  </h1>
                  <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                    Order Confirmation
                  </p>
                </td>
              </tr>

              <!-- Greeting & Status -->
              <tr>
                <td style="padding: 30px 30px 15px 30px;">
                  <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 10px 0; font-weight: 800;">
                    Thank you for your order, ${customerDetails.name}! 🎉
                  </h2>
                  <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0;">
                    Your toy order has been successfully placed and received by our fulfillment center. We are currently verifying and packaging your items.
                  </p>
                </td>
              </tr>

              <!-- Order Overview Box -->
              <tr>
                <td style="padding: 10px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px;">
                    <tr>
                      <td width="50%" style="font-size: 12px; color: #64748b; padding: 4px 8px;">
                        Order ID: <strong style="color: #0f172a; font-family: monospace;">${order.id}</strong>
                      </td>
                      <td width="50%" style="font-size: 12px; color: #64748b; padding: 4px 8px;">
                        Date: <strong style="color: #0f172a;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="font-size: 12px; color: #64748b; padding: 4px 8px;">
                        Payment Mode: <strong style="color: ${order.payment_method === 'COD' ? '#b45309' : '#047857'};">${order.payment_method}</strong>
                      </td>
                      <td width="50%" style="font-size: 12px; color: #64748b; padding: 4px 8px;">
                        Payment Status: <strong style="color: #0f172a;">${order.payment_status || 'PENDING'}</strong>
                      </td>
                    </tr>
                    ${order.payment_method === 'COD' ? `
                    <tr>
                      <td colspan="2" style="padding: 8px 8px 4px 8px; font-size: 12px; color: #92400e; font-weight: bold;">
                        💵 Cash to Collect on Delivery: ₹${order.total_amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 15px 30px;">
                  <h3 style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                    Ordered Items
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e2e8f0; background-color: #f8fafc;">
                        <th style="padding: 8px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">Item</th>
                        <th style="padding: 8px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase;">Qty</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase;">Price</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Price Breakdown -->
              <tr>
                <td style="padding: 0 30px 15px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Subtotal:</td>
                      <td style="font-size: 12px; color: #0f172a; font-weight: bold; text-align: right;">₹${(order.subtotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    ${order.discount_amount > 0 ? `
                    <tr>
                      <td style="font-size: 12px; color: #16a34a; padding: 3px 0;">Discount Applied:</td>
                      <td style="font-size: 12px; color: #16a34a; font-weight: bold; text-align: right;">- ₹${order.discount_amount.toLocaleString('en-IN')}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Shipping Fee:</td>
                      <td style="font-size: 12px; color: #0f172a; font-weight: bold; text-align: right;">${order.shipping_charge === 0 ? 'FREE' : `₹${order.shipping_charge}`}</td>
                    </tr>
                    ${order.cod_charge > 0 ? `
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">COD Handling Fee:</td>
                      <td style="font-size: 12px; color: #0f172a; font-weight: bold; text-align: right;">₹${order.cod_charge}</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 2px solid #0f172a;">
                      <td style="font-size: 15px; color: #0f172a; font-weight: 900; padding: 8px 0 0 0;">Grand Total:</td>
                      <td style="font-size: 18px; color: #0284c7; font-weight: 900; text-align: right; padding: 8px 0 0 0;">₹${(order.total_amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Delivery Address Box -->
              <tr>
                <td style="padding: 10px 30px;">
                  <div style="background-color: #f8fafc; border-radius: 14px; padding: 15px; border: 1px solid #e2e8f0;">
                    <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #0f172a; text-transform: uppercase; font-weight: 800;">
                      📦 Delivery Address
                    </h4>
                    <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
                      <strong>${customerDetails.name}</strong> (${customerDetails.phone})<br>
                      ${customerDetails.address}<br>
                      ${customerDetails.city ? `${customerDetails.city}, ` : ''}${customerDetails.state ? `${customerDetails.state} - ` : ''}<strong>${customerDetails.pincode}</strong>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Cancellation & No-Return Policy Reminder -->
              <tr>
                <td style="padding: 15px 30px;">
                  <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px; font-size: 11px; color: #92400e; line-height: 1.5;">
                    <strong>TRENDYTOYZ Cancellation Policy:</strong> Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.
                  </div>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 10px 30px 30px 30px; text-align: center;">
                  <a href="${trackingLink}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                    Track Live Shipment Status
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
                  Need help? Contact us at <a href="mailto:${config.senderEmail}" style="color: #0284c7; text-decoration: none;">${config.senderEmail}</a> or WhatsApp: <strong>${config.supportPhone}</strong><br>
                  Follow us on Instagram: <a href="${config.instagramUrl}" style="color: #e1306c; font-weight: bold; text-decoration: none;">@${config.instagramId}</a><br>
                  © ${new Date().getFullYear()} ${config.brandName}. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Deliver or log
  const transporter = getTransporter(config);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.senderName}" <${config.senderEmail}>`,
        to: recipientEmail,
        subject: `Order Confirmed! Your TRENDYTOYZ Order #${order.id} is being prepared`,
        html: htmlContent
      });
      console.log(`[Email] Customer order confirmation sent to ${recipientEmail} for #${order.id}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.error(`[Email] Failed to send customer confirmation email to ${recipientEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`================================================================`);
    console.log(`📧 [MOCK EMAIL DELIVERED TO CUSTOMER: ${recipientEmail}]`);
    console.log(`Subject: Order Confirmed! Your TRENDYTOYZ Order #${order.id} is being prepared`);
    console.log(`Order Total: ₹${order.total_amount} | Payment: ${order.payment_method}`);
    console.log(`(Configure SMTP in Admin Settings > Email/Notifications to send live emails)`);
    console.log(`================================================================`);
    return { success: true, delivered: false, simulated: true };
  }
}

/**
 * 2. Send New Order Alert Notification to Store Admin / Owner
 */
async function sendAdminNewOrderAlert({ order, items, customerDetails, liveUrl }) {
  const config = getEmailConfig();
  const adminEmail = config.adminAlertEmail;

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; font-weight: bold;">
        ${item.product?.name || item.product_name}
        <br><span style="font-size: 11px; color: #64748b; font-weight: normal;">SKU: ${item.product?.sku || item.sku || 'N/A'}</span>
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 13px; font-weight: bold; color: #0284c7;">
        x${item.quantity}
      </td>
      <td style="padding: 10px 8px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a;">
        ₹${(item.total || (item.price * item.quantity) || 0).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const adminOrdersUrl = `${liveUrl || 'https://jgrl.co'}/admin/orders`;

  const cleanPhone = (customerDetails.phone || '').replace(/[^0-9]/g, '').slice(-10);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert - ${order.id}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              <!-- Alert Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0B192C 0%, #1e1b4b 100%); padding: 30px; text-align: center;">
                  <span style="background-color: #ef4444; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                    🚨 NEW ORDER RECEIVED
                  </span>
                  <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 900;">
                    Order #${order.id}
                  </h1>
                  <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 18px; font-weight: 800;">
                    Total: ₹${(order.total_amount || 0).toLocaleString('en-IN')}
                  </p>
                </td>
              </tr>

              <!-- Customer Details Box -->
              <tr>
                <td style="padding: 24px 30px 10px 30px;">
                  <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
                      👤 Customer & Contact Details
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                      <tr>
                        <td width="35%" style="color: #64748b; padding: 3px 0;">Customer Name:</td>
                        <td width="65%" style="color: #0f172a; font-weight: bold;">${customerDetails.name || 'Customer'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 3px 0;">Phone Number:</td>
                        <td style="color: #0f172a; font-weight: bold;">
                          <a href="tel:${customerDetails.phone || ''}" style="color: #0284c7; text-decoration: none;">${customerDetails.phone || 'N/A'}</a>
                          ${cleanPhone ? `
                          <a href="https://wa.me/91${cleanPhone}" style="display: inline-block; margin-left: 8px; color: #16a34a; font-size: 11px; font-weight: bold; text-decoration: none;">
                            [WhatsApp]
                          </a>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 3px 0;">Email:</td>
                        <td style="color: #0f172a; font-weight: bold;">${customerDetails.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 3px 0; vertical-align: top;">Delivery Address:</td>
                        <td style="color: #0f172a; font-weight: bold; line-height: 1.4;">
                          ${customerDetails.address || 'Address on file'}${customerDetails.city ? `, ${customerDetails.city}` : ''}${customerDetails.state ? `, ${customerDetails.state}` : ''} - <strong>${customerDetails.pincode || ''}</strong>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Payment Details Notice -->
              <tr>
                <td style="padding: 10px 30px;">
                  <div style="background-color: ${order.payment_method === 'COD' ? '#fef3c7' : '#ecfdf5'}; border: 1px solid ${order.payment_method === 'COD' ? '#fde68a' : '#a7f3d0'}; border-radius: 12px; padding: 14px;">
                    <div style="font-size: 13px; font-weight: 800; color: ${order.payment_method === 'COD' ? '#92400e' : '#065f46'};">
                      ${order.payment_method === 'COD' 
                        ? `💵 CASH ON DELIVERY: Collect ₹${order.total_amount?.toLocaleString('en-IN')} in Cash on delivery.` 
                        : `💳 PREPAID PAYMENT: Payment verified online (${order.payment_status || 'PAID'}). DO NOT collect cash.`}
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Items to Pack -->
              <tr>
                <td style="padding: 15px 30px;">
                  <h3 style="color: #0f172a; font-size: 13px; margin: 0 0 10px 0; font-weight: 800; text-transform: uppercase;">
                    📦 Toys to Pack (${items.length} items)
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 8px; text-align: left; font-size: 11px; color: #475569;">Product</th>
                        <th style="padding: 8px; text-align: center; font-size: 11px; color: #475569;">Qty</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; color: #475569;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Action Button to Admin Orders -->
              <tr>
                <td style="padding: 15px 30px 30px 30px; text-align: center;">
                  <a href="${adminOrdersUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(15, 23, 42, 0.4);">
                    👉 Open Admin Panel to [Accept Order]
                  </a>
                  <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0;">
                    Accepting order unlocks thermal shipping label download & courier dispatch.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  TRENDYTOYZ Automated Store Management Alert • Received at ${new Date().toLocaleTimeString('en-IN')}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter(config);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.brandName} Store Alert" <${config.senderEmail}>`,
        to: adminEmail,
        subject: `🚨 New Order Received! Order #${order.id} - ₹${order.total_amount} from ${customerDetails.name || 'Customer'}`,
        html: htmlContent
      });
      console.log(`[Email] Admin order alert sent to ${adminEmail} for #${order.id}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.error(`[Email] Failed to send admin order alert to ${adminEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`================================================================`);
    console.log(`🚨 [MOCK ADMIN NOTIFICATION DELIVERED: ${adminEmail}]`);
    console.log(`Subject: New Order Received! #${order.id} from ${customerDetails.name || 'Customer'} (${customerDetails.phone || 'No phone'})`);
    console.log(`Order Amount: ₹${order.total_amount} | Payment: ${order.payment_method}`);
    console.log(`Customer Address: ${customerDetails.address || 'Address on file'}, ${customerDetails.city || ''} - ${customerDetails.pincode || ''}`);
    console.log(`Items count: ${items.length}`);
    console.log(`(Configure SMTP in Admin Settings > Notifications to send live emails)`);
    console.log(`================================================================`);
    return { success: true, delivered: false, simulated: true };
  }
}

/**
 * 3. Send Test Email (for Admin Settings configuration verification)
 */
async function sendTestEmail(recipientEmail) {
  const config = getEmailConfig();
  const targetEmail = recipientEmail || config.adminAlertEmail;
  const transporter = getTransporter(config);

  const testHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%); padding: 24px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">🧪 TRENDYTOYZ SMTP Test Email</h2>
        <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 12px; font-weight: 600;">Automated Notification System Verification</p>
      </div>
      <div style="padding: 24px;">
        <p style="color: #0f172a; font-size: 14px; font-weight: 700; margin-top: 0;">
          ✅ Success! Your email server settings are properly configured.
        </p>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">
          Your TRENDYTOYZ store is now ready to automatically dispatch:
        </p>
        <ul style="color: #334155; font-size: 13px; line-height: 1.7; padding-left: 20px;">
          <li><strong>Customer Order Confirmation:</strong> Itemized toy list, price breakdown, cancellation policy, and live shipment tracking link.</li>
          <li><strong>Store Owner Alert:</strong> Real-time alert with customer name, phone number, delivery address, and toys to pack.</li>
        </ul>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-top: 16px; font-size: 12px; color: #64748b;">
          <strong>SMTP Host:</strong> ${config.smtpHost} (Port: ${config.smtpPort})<br>
          <strong>Sender Email:</strong> ${config.senderEmail}<br>
          <strong>Admin Alert Email:</strong> ${config.adminAlertEmail}<br>
          <strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.brandName}" <${config.senderEmail}>`,
        to: targetEmail,
        subject: `🧪 Test Email from ${config.brandName} Toys Store`,
        html: testHtml
      });
      console.log(`[Email] Test email successfully delivered via SMTP to ${targetEmail}`);
      return { success: true, delivered: true, recipient: targetEmail };
    } catch (err) {
      console.error(`[Email] Test email delivery failed to ${targetEmail}:`, err.message);
      return { success: false, error: err.message, recipient: targetEmail };
    }
  } else {
    console.log(`[Email] Simulated Test Email to ${targetEmail} (No SMTP password set yet)`);
    return { 
      success: true, 
      delivered: false, 
      simulated: true, 
      recipient: targetEmail,
      note: 'SMTP credentials (smtp_user & smtp_pass) not configured yet. Set them in Admin Settings > Email & Notifications.'
    };
  }
}

module.exports = {
  getEmailConfig,
  sendCustomerOrderConfirmation,
  sendAdminNewOrderAlert,
  sendTestEmail
};
