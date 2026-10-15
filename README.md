# JGRL.CO - Production Ecommerce Shopping Platform

JGRL.CO is a complete, production-ready ecommerce platform built for Indian ecommerce customers selling **Toys**, **Wallets**, and future expandable product categories.

---

## 🚀 Key Features Overview

### 🛍️ Customer Experience
- **Modern Design**: Built with a dark navy (`#0B192C`), crisp white, and metallic silver color palette, clean typography, responsive layout for desktop, tablet, and mobile.
- **Product Catalogue & Multi-Filtering**: Multi-faceted filter system by Category, Price Range slider/inputs, In-Stock filter, and Sort options (Price Low-High, Price High-Low, Newest, Popular, Best Selling).
- **Live Search**: Real-time autocomplete search dropdown for products, categories, and SKUs.
- **Product Detail Page**: Multi-image thumbnail gallery, SKU, MRP strike-through, discount %, stock availability indicator, variant selector, quantity selector, Add to Cart, Buy Now, Wishlist, Pincode delivery & COD availability checker, Amazon/Flipkart/Meesho marketplace badges, and verified customer reviews.
- **Cart & Checkout**:
  - Cart item persistence in database / LocalStorage.
  - Promo coupon code validation & discount calculation.
  - Shipping fee calculation with Free Shipping threshold indicator (Free on orders above ₹799).
  - COD handling fee indicator.
  - Dual Payment Options:
    1. **Online Payment Gateway**: Integrated with Razorpay Checkout SDK & server-side signature verification (`/api/checkout/verify-payment`).
    2. **Cash on Delivery (COD)**: Eligibility validation, placing order with status `COD CONFIRMED` and generating unique Order ID (`JGRL-YYYYMMDD-XXXX`).
- **Customer Order Tracking (`/track-order`)**:
  - Public order lookup by Order ID + Mobile Number / Email.
  - Visual timeline progress (`Order Placed` ➔ `Payment/COD Confirmed` ➔ `Processing` ➔ `Packed` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`).
  - Courier AWB tracking number, estimated delivery date, and direct courier tracking link button.
- **Customer Account & History**: Customer registration, login, profile management, saved address book, order history, invoice download, wishlist management, and order cancellation.
- **Tax Invoice Generation**: Professional GST Tax Invoice view & print/PDF download (`/invoice/:id`).

---

### 🛡️ Admin Panel (`/admin`)
- **Secure Authentication**: Admin login (`sallujags@gmail.com`) authenticated via JWT with password hashed via `bcryptjs` and configured through environment variables.
- **Executive Dashboard**: Real-time metrics (Total Sales, Today's Sales, Orders Count, Pending, Processing, Shipped, Delivered, Cancelled, COD vs Online breakdown, Total Customers, Low Stock Alerts) and Recharts visual charts.
- **Product Management**: Full CRUD, duplicate product, status toggle, multi-image URLs, MRP/selling price/cost price, stock quantity, low stock thresholds, variants, Amazon/Flipkart/Meesho marketplace URLs, and SEO meta tags.
- **Category Management**: Unlimited category creation with cover images and display order.
- **Inventory Management**: Stock overview table, low stock alert badges, atomic stock deduction on purchase, and quick stock adjustment modal.
- **Order Management**: Comprehensive order table with multi-parameter search/filtering, status updater modal, courier shipment updater (Courier Name, AWB, Tracking URL, Est Delivery Date), and print invoice.
- **Customer Management**: Customer directory, total spend, order count, and account block/unblock controls.
- **Coupons System**: Percentage vs Fixed discount coupons, min order spend, max discount cap, usage limits, and active toggles.
- **Banner Management**: Manage homepage hero sliders, subtitles, images, and CTA button URLs.
- **Review Moderation**: Approve, hide, or delete customer product reviews.
- **Marketplace Links Manager**: Bulk or per-product overview of Amazon, Flipkart, and Meesho URLs.
- **Analytical Reports**: One-click CSV export for Sales Reports and Inventory Audit Reports.
- **Store Settings**: Configure brand details, GSTIN, Razorpay/PhonePe API keys, COD rules, shipping charges, and tax rates.

---

## 🛠️ Project Structure

```
jgrlco/
├── server/
│   ├── index.js               # Express app entry point & routes mounting
│   ├── db.js                  # SQLite database schema, WAL mode & auto-seeding
│   ├── middleware/
│   │   └── auth.js            # JWT token & Admin role verification
│   └── routes/
│       ├── auth.js            # Customer & Admin login/register
│       ├── products.js        # Products CRUD, search & filters
│       ├── categories.js      # Category management
│       ├── checkout.js        # COD order placement & Razorpay payment verification
│       ├── orders.js          # Order history, status updates & invoice payload
│       ├── tracking.js        # Public order tracking API
│       ├── admin.js           # Dashboard metrics, customer management & CSV reports
│       ├── coupons.js         # Coupon CRUD & validation
│       ├── banners.js         # Hero slider banner manager
│       ├── reviews.js         # Product reviews submission & moderation
│       ├── addresses.js       # Saved delivery addresses
│       └── settings.js        # Store & payment gateway settings
├── src/
│   ├── main.jsx               # App entry with Router & Context Providers
│   ├── App.jsx                # Application Routes
│   ├── index.css              # Tailwind & custom CSS styles
│   ├── services/
│   │   └── api.js             # Centralized API service helper
│   ├── context/
│   │   ├── AuthContext.jsx     # Customer & Admin auth state
│   │   ├── CartContext.jsx     # Cart state & coupon application
│   │   └── WishlistContext.jsx # Saved items context
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx     # Header with logo, live search & category menu
│   │   │   ├── Footer.jsx     # Footer with trust badges, links & payment badges
│   │   │   └── MobileNav.jsx  # Smartphone bottom navigation bar
│   │   ├── product/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductFilter.jsx
│   │   │   └── MarketplaceBadges.jsx
│   │   └── admin/
│   │       ├── AdminSidebar.jsx
│   │       └── AdminHeader.jsx
│   └── pages/
│       ├── Home.jsx           # Homepage with Hero, Categories & Reviews
│       ├── Shop.jsx           # All Products page with multi-filtering
│       ├── CategoryPage.jsx   # Dynamic category landing pages
│       ├── ProductDetail.jsx  # Product detail, pincode checker & reviews
│       ├── Cart.jsx           # Shopping cart
│       ├── Checkout.jsx       # Checkout with COD & Online payment
│       ├── OrderConfirmation.jsx # Order celebration & tracking preview
│       ├── OrderTracking.jsx  # Public order tracking page (/track-order)
│       ├── Invoice.jsx        # Printable GST Tax Invoice
│       ├── Account/           # Login, Register, Dashboard
│       ├── Policies/          # About, Contact, Privacy, Terms, Refund, Shipping
│       └── admin/             # Complete Admin Panel pages
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Environment Variables Config (`.env`)

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=JGRL_CO_SECURE_JWT_SECRET_KEY_2026
ADMIN_EMAIL=sallujags@gmail.com
ADMIN_PASSWORD=JgrlCo@2026AdminSecret

# Payment Gateway Setup (Configurable from Admin Panel or .env)
RAZORPAY_KEY_ID=rzp_test_placeholder_key
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Production Asset Bundle
```bash
npm run build
```

### 3. Run Development Server (Runs Backend Server + Frontend Proxy)
```bash
npm run dev
```

The application will be running on:
- Customer Website: `http://localhost:5000` (or `http://localhost:3000`)
- Admin Panel: `http://localhost:5000/admin`
  - **Admin Email**: `sallujags@gmail.com`
  - **Admin Password**: `S@lman2538`

---

## 💳 Payment Gateway Setup Instructions

1. **Razorpay Integration**:
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) > Settings > API Keys.
   - Copy your **Key ID** and **Key Secret**.
   - Navigate to `/admin/settings` on the Admin Panel.
   - Enter your **Razorpay Key ID** and **Key Secret** under Payment Gateway Setup and click **Save Settings**.
   - Server-side signature verification endpoint (`/api/checkout/verify-payment`) automatically validates payment authenticity.

2. **PhonePe / Cashfree Integration**:
   - Select your provider in `/admin/settings` and enter Merchant ID & Salt keys.

---

## 🚚 Shipping & Tracking Setup Instructions

1. **Manual Courier Tracking**:
   - Admin can manually enter Courier Name (e.g. Shiprocket, Delhivery, Blue Dart, DTDC), AWB Tracking Number, Tracking URL, and Estimated Delivery Date under `/admin/orders` or `/admin/shipping`.
   - Customer accesses `/track-order`, enters Order ID and Phone/Email to view live status and click "Track Shipment".

2. **Automated Courier Integration (Shiprocket / Delhivery)**:
   - Structure is built modularly inside `server/routes/orders.js` and `server/routes/tracking.js` for direct Webhook integration.

---

## 📦 Deployment Instructions

1. **Node.js Cloud Server (AWS EC2 / DigitalOcean / Render / VPS)**:
   - Clone codebase to server.
   - Run `npm install` and `npm run build`.
   - Set environment variables (`PORT=5000`, `ADMIN_PASSWORD=...`).
   - Start process via PM2: `pm2 start server/index.js --name "jgrlco"`.

---

## 🔐 Credentials & Security Confirmation

- **Admin Login Email**: `sallujags@gmail.com`
- **Initial Admin Password**: Configurable via `ADMIN_PASSWORD` env variable (Default setup initialized securely with bcrypt hashing in SQLite DB).
- No admin passwords or payment secret keys are stored in plain text or client-side code.
