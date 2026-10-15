import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileNav from './components/layout/MobileNav';
import { getApiBase } from './services/api';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Account/Login';
import Register from './pages/Account/Register';
import Dashboard from './pages/Account/Dashboard';
import Invoice from './pages/Invoice';

// Policy Pages
import About from './pages/Policies/About';
import Contact from './pages/Policies/Contact';
import PrivacyPolicy from './pages/Policies/PrivacyPolicy';
import Terms from './pages/Policies/Terms';
import RefundPolicy from './pages/Policies/RefundPolicy';
import ShippingPolicy from './pages/Policies/ShippingPolicy';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminShipping from './pages/admin/AdminShipping';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBanners from './pages/admin/AdminBanners';
import AdminReviews from './pages/admin/AdminReviews';
import AdminMarketplace from './pages/admin/AdminMarketplace';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInvoiceRoute = location.pathname.startsWith('/invoice');

  const hideHeaderFooter = isAdminRoute || isInvoiceRoute;

  // Background keepalive to wake up Render free tier backend instantly on page load
  useEffect(() => {
    try {
      const base = getApiBase();
      const ping = () => {
        fetch(`${base}/health`, { method: 'GET' }).catch(() => {});
      };
      ping();
      const interval = setInterval(ping, 7 * 60 * 1000); // Ping every 7 mins while active
      return () => clearInterval(interval);
    } catch (e) {
      // Ignore background ping errors
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {!hideHeaderFooter && <Header />}

      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/toys" element={<CategoryPage />} />
          <Route path="/clothes" element={<Navigate to="/shop" replace />} />
          <Route path="/wallets" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/account/login" element={<Login />} />
          <Route path="/account/register" element={<Register />} />
          <Route path="/account" element={<Dashboard />} />
          <Route path="/account/orders" element={<Dashboard />} />
          <Route path="/account/wishlist" element={<Dashboard />} />
          <Route path="/invoice/:id" element={<Invoice />} />

          {/* Policies */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/shipping" element={<AdminShipping />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <MobileNav />}
    </div>
  );
}
