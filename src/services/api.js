// API client wrapper for TRENDYTOYZ frontend

export function getApiBase() {
  if (typeof window === 'undefined') return '/api';

  // 1. Prioritize environment variable if set
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    // Upgrade http to https when frontend is served over https to prevent Mixed Content
    if (window.location.protocol === 'https:' && clean.startsWith('http://')) {
      clean = clean.replace(/^http:\/\//i, 'https://');
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 2. Production HTTPS: ALWAYS use relative '/api' (handled by vercel.json rewrites)
  if (window.location.protocol === 'https:') {
    return '/api';
  }

  // 3. Local HTTP Development only (localhost / 127.0.0.1)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]';
  if (isLocal) {
    if (window.location.port === '3000' || window.location.port === '5000') {
      return '/api';
    }
    return `http://${window.location.hostname}:5000/api`;
  }

  return '/api';
}

export function getAuthToken() {
  return localStorage.getItem('jgrl_token') || '';
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Only set application/json if body is not FormData (browser sets boundary automatically for FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const base = getApiBase();
  const primaryUrl = `${base}${endpoint}`;

  let response;
  try {
    response = await fetch(primaryUrl, {
      ...options,
      headers
    });
    // Local development only: if relative /api returned 404, fallback to direct 127.0.0.1:5000 (never on HTTPS)
    const isLocalHttp = typeof window !== 'undefined' && 
      window.location.protocol === 'http:' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (response.status === 404 && isLocalHttp && !primaryUrl.includes(':5000')) {
      const fallbackUrl = `http://127.0.0.1:5000/api${endpoint}`;
      try {
        const fallbackRes = await fetch(fallbackUrl, { ...options, headers });
        if (fallbackRes.ok || fallbackRes.status !== 404) {
          response = fallbackRes;
        }
      } catch (fallbackErr) {
        // Keep primary response
      }
    }
  } catch (networkErr) {
    const isLocalHttp = typeof window !== 'undefined' && 
      window.location.protocol === 'http:' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalHttp && !primaryUrl.includes(':5000')) {
      try {
        const fallbackUrl = `http://127.0.0.1:5000/api${endpoint}`;
        response = await fetch(fallbackUrl, { ...options, headers });
      } catch (fallbackErr) {
        throw new Error('Server connection error. Please ensure backend server is running on port 5000.');
      }
    } else {
      throw new Error('Server connection error. Please check your internet connection or verify the backend service is running.');
    }
  }

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      data = { success: false, error: 'Invalid response format from server.' };
    }
  } else {
    const rawText = await response.text();
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Server error (${response.status}): Kripya thodi der baad dobara try karein.`);
      }
      data = { success: false, error: rawText || 'Unexpected server response.' };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body) => apiRequest('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  appleLogin: (body) => apiRequest('/auth/apple', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (body) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Media / Image Upload
  uploadImage: (formData) => apiRequest('/products/upload-image', { method: 'POST', body: formData }),
  uploadImages: (formData) => apiRequest('/products/upload-images', { method: 'POST', body: formData }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products?${query}`);
  },
  getProductBySlug: (slug) => apiRequest(`/products/${slug}`),
  getAdminProducts: () => apiRequest('/products/admin/all'),
  createProduct: (body) => apiRequest('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadImages: (formData) => apiRequest('/products/upload-images', { method: 'POST', body: formData }),
  toggleProductCod: (id) => apiRequest(`/products/${id}/toggle-cod`, { method: 'PATCH' }),
  deleteProduct: (id, soft = false) => apiRequest(`/products/${id}${soft ? '?soft=true' : ''}`, { method: 'DELETE' }),
  archiveProduct: (id) => apiRequest(`/products/${id}/archive`, { method: 'POST' }),
  duplicateProduct: (id) => apiRequest(`/products/duplicate/${id}`, { method: 'POST' }),
  bulkUpdateProductStatus: (ids, status) => apiRequest('/products/admin/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  bulkDeleteProducts: (ids, softDelete = true) => apiRequest('/products/admin/bulk-delete', { method: 'POST', body: JSON.stringify({ ids, softDelete }) }),
  bulkUpdateProductPrices: (ids, type, value, direction) => apiRequest('/products/admin/bulk-price-update', { method: 'POST', body: JSON.stringify({ ids, type, value, direction }) }),

  // Couriers
  getCouriers: () => apiRequest('/couriers'),
  getAdminCouriers: () => apiRequest('/couriers/admin'),
  createCourier: (body) => apiRequest('/couriers', { method: 'POST', body: JSON.stringify(body) }),
  updateCourier: (id, body) => apiRequest(`/couriers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleCourierStatus: (id) => apiRequest(`/couriers/${id}/toggle`, { method: 'PATCH' }),
  deleteCourier: (id) => apiRequest(`/couriers/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => apiRequest('/categories'),
  getAdminCategories: () => apiRequest('/categories/admin'),
  createCategory: (body) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),

  // Checkout & Orders
  validateCoupon: (code, subtotal) => apiRequest('/checkout/validate-coupon', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  calculateSummary: (body) => apiRequest('/checkout/calculate-summary', { method: 'POST', body: JSON.stringify(body) }),
  placeOrder: (body) => apiRequest('/checkout/place-order', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body) => apiRequest('/checkout/verify-payment', { method: 'POST', body: JSON.stringify(body) }),
  createRazorpayOrder: (body) => apiRequest('/create-order', { method: 'POST', body: JSON.stringify(body) }),
  verifyRazorpaySignature: (body) => apiRequest('/verify-payment', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: () => apiRequest('/orders/my-orders'),
  getMyOrderById: (id) => apiRequest(`/orders/my-orders/${id}`),
  cancelOrder: (id, reason) => apiRequest(`/orders/cancel/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getInvoice: (id) => apiRequest(`/orders/invoice/${id}`),

  // Tracking
  trackOrder: (orderId, identifier) => apiRequest(`/tracking?orderId=${encodeURIComponent(orderId)}&identifier=${encodeURIComponent(identifier)}`),

  // Admin Orders
  getDashboardStats: () => apiRequest('/admin/dashboard-stats'),
  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders/admin/all?${query}`);
  },
  getAdminOrderById: (id) => apiRequest(`/orders/admin/${id}`),
  acceptOrder: (id) => apiRequest(`/orders/admin/${id}/accept`, { method: 'POST' }),
  cancelOrderAdmin: (id, reason, notes = '') => apiRequest(`/orders/admin/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason, notes }) }),
  markOrderPacked: (id) => apiRequest(`/orders/admin/${id}/pack`, { method: 'POST' }),
  dispatchOrder: (id, body) => apiRequest(`/orders/admin/${id}/dispatch`, { method: 'POST', body: JSON.stringify(body) }),
  deliverOrder: (id) => apiRequest(`/orders/admin/${id}/deliver`, { method: 'POST' }),
  updateOrderStatus: (id, body) => apiRequest(`/orders/admin/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  updateOrderTracking: (id, body) => apiRequest(`/orders/admin/${id}/tracking`, { method: 'PUT', body: JSON.stringify(body) }),
  getBulkLabelsData: (orderIds) => apiRequest('/orders/admin/bulk-labels', { method: 'POST', body: JSON.stringify({ orderIds }) }),
  getCustomers: () => apiRequest('/admin/customers'),
  updateCustomerStatus: (id, status) => apiRequest(`/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getReportCsv: (type) => apiRequest(`/admin/reports?type=${type}`),

  // Coupons
  getCoupons: () => apiRequest('/coupons'),
  createCoupon: (body) => apiRequest('/coupons', { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (id, body) => apiRequest(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoupon: (id) => apiRequest(`/coupons/${id}`, { method: 'DELETE' }),

  // Banners
  getBanners: () => apiRequest('/banners'),
  getAdminBanners: () => apiRequest('/banners/admin'),
  createBanner: (body) => apiRequest('/banners', { method: 'POST', body: JSON.stringify(body) }),
  updateBanner: (id, body) => apiRequest(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBanner: (id) => apiRequest(`/banners/${id}`, { method: 'DELETE' }),

  // Reviews
  submitReview: (body) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getAdminReviews: () => apiRequest('/reviews/admin'),
  moderateReview: (id, status) => apiRequest(`/reviews/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteReview: (id) => apiRequest(`/reviews/admin/${id}`, { method: 'DELETE' }),

  // Addresses
  getAddresses: () => apiRequest('/addresses'),
  addAddress: (body) => apiRequest('/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id, body) => apiRequest(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress: (id) => apiRequest(`/addresses/${id}`, { method: 'DELETE' }),

  // Settings
  getPublicSettings: () => apiRequest('/settings/public'),
  getAdminSettings: () => apiRequest('/settings/admin'),
  updateAdminSettings: (body) => apiRequest('/settings/admin', { method: 'PUT', body: JSON.stringify(body) }),
  testEmailSettings: (body = {}) => apiRequest('/settings/test-email', { method: 'POST', body: JSON.stringify(body) }),

  // Data Safety, Soft Delete Restores & Database Backups
  restoreProduct: (id) => apiRequest(`/products/${id}/restore`, { method: 'POST' }),
  restoreCategory: (id) => apiRequest(`/categories/${id}/restore`, { method: 'POST' }),
  getBackupsList: () => apiRequest('/backup/list'),
  createBackupSnapshot: (label = 'manual') => apiRequest('/backup/create', { method: 'POST', body: JSON.stringify({ label }) }),
  importBackup: (data) => apiRequest('/backup/import', { method: 'POST', body: JSON.stringify(data) })
};
