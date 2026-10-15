import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut, Truck, ExternalLink, Printer, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';

export default function Dashboard() {
  const { user, logout, updateProfileState } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'profile' | 'orders' | 'addresses' | 'wishlist'
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Address Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street_address: '',
    city: '',
    state: '',
    pincode: '',
    is_default: true
  });

  // Cancellation Modal state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    order: null,
    reason: 'Changed my mind',
    notes: '',
    loading: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/account/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [ordRes, addrRes] = await Promise.all([
        api.getMyOrders(),
        api.getAddresses()
      ]);

      if (ordRes.success) setOrders(ordRes.orders);
      if (addrRes.success) setAddresses(addrRes.addresses);
    } catch (err) {
      console.error('Error loading account dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const res = await api.updateProfile({ name: profileName, phone: profilePhone });
      if (res.success) {
        updateProfileState(res.user);
        setProfileMsg('Profile updated successfully!');
      }
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addAddress(newAddr);
      if (res.success) {
        setShowAddressForm(false);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to add address:', err);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.deleteAddress(id);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const openCancelDialog = (order) => {
    setCancelModal({
      isOpen: true,
      order,
      reason: 'Changed my mind',
      notes: '',
      loading: false
    });
  };

  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelModal.order) return;
    setCancelModal(m => ({ ...m, loading: true }));
    try {
      const fullReason = `${cancelModal.reason}${cancelModal.notes ? ` - ${cancelModal.notes}` : ''}`;
      const res = await api.cancelOrder(cancelModal.order.id, fullReason);
      if (res.success) {
        alert(res.message || 'Order cancelled successfully.');
        setCancelModal({ isOpen: false, order: null, reason: 'Changed my mind', notes: '', loading: false });
        loadDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
      setCancelModal(m => ({ ...m, loading: false }));
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Account Banner */}
      <div className="bg-navy-gradient text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-300 font-extrabold text-2xl flex items-center justify-center border border-sky-400/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user.name}</h1>
            <p className="text-slate-300 text-xs">{user.email} • Customer Account</p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-sm">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition ${
                activeTab === 'orders' ? 'bg-navy-gradient text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 text-sky-400" /> My Orders ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition ${
                activeTab === 'profile' ? 'bg-navy-gradient text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-sky-400" /> My Profile
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition ${
                activeTab === 'addresses' ? 'bg-navy-gradient text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-sky-400" /> My Addresses ({addresses.length})
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition ${
                activeTab === 'wishlist' ? 'bg-navy-gradient text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4 text-sky-400" /> Wishlist ({wishlist.length})
            </button>

            <Link
              to="/track-order"
              className="block w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold text-sky-600 hover:bg-sky-50 transition flex items-center gap-2.5"
            >
              <Truck className="w-4 h-4" /> Track Any Order
            </Link>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">Order History</h2>
                <span className="text-xs text-slate-500 font-semibold">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</span>
              </div>

              {/* Policy Alert Banner */}
              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-sky-950">
                <Truck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">TRENDYTOYZ Cancellation & Delivery Policy:</span>
                  <p className="text-sky-800 mt-0.5">
                    Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.
                  </p>
                </div>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => {
                    const statusUpper = (order.order_status || '').toUpperCase();
                    const isDispatchedOrFinal = ['DISPATCHED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED', 'COMPLETED'].includes(statusUpper);
                    const isCancelled = statusUpper.includes('CANCEL');
                    const canCancel = !isDispatchedOrFinal && !isCancelled;

                    return (
                      <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">Order ID: {order.id}</span>
                            <span className="text-slate-400">
                              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${
                              order.order_status === 'DELIVERED' || order.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              isCancelled ? 'bg-rose-100 text-rose-800' :
                              isDispatchedOrFinal ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {order.order_status}
                            </span>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="divide-y divide-slate-100">
                          {order.items.map(item => (
                            <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900">{item.product_name}</span>
                                <span className="text-slate-400 block">SKU: {item.sku} | Qty: {item.quantity}</span>
                              </div>
                              <span className="font-extrabold text-slate-900">₹{item.total.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Actions Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                          <div className="font-extrabold text-slate-900">
                            Total Amount: <span className="text-sky-600 text-sm">₹{order.total_amount.toLocaleString('en-IN')}</span> ({order.payment_method})
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/track-order?orderId=${encodeURIComponent(order.id)}`}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" /> Track Status
                            </Link>

                            <Link
                              to={`/invoice/${order.id}`}
                              target="_blank"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> Invoice
                            </Link>

                            {/* Conditional Cancellation Button vs Dispatched Notice */}
                            {canCancel ? (
                              <button
                                onClick={() => openCancelDialog(order)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-3 py-1.5 rounded-xl transition"
                              >
                                Cancel Order
                              </button>
                            ) : isDispatchedOrFinal ? (
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                Cancellation/return not available for dispatched orders
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  You have not placed any orders yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900">My Profile Details</h2>

              {profileMsg && <p className="text-xs font-bold text-emerald-600">{profileMsg}</p>}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-navy-gradient text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-navy-gradient text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm">Add New Address</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newAddr.full_name}
                        onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                    <textarea
                      required
                      rows={2}
                      value={newAddr.street_address}
                      onChange={(e) => setNewAddr({ ...newAddr, street_address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-extrabold px-6 py-2 rounded-xl text-xs transition"
                  >
                    Save Address
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 relative shadow-sm">
                    {addr.is_default === 1 && (
                      <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Default
                      </span>
                    )}
                    <h4 className="font-extrabold text-slate-900 text-sm">{addr.full_name} ({addr.phone})</h4>
                    <p className="text-xs text-slate-600">{addr.street_address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 pt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900">Wishlist Saved Items</h2>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlist.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  Your wishlist is currently empty.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal with Confirmation & Reason Dropdown */}
      {cancelModal.isOpen && cancelModal.order && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-slate-900 text-base">
                Cancel Order #{cancelModal.order.id}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Orders can be cancelled only before dispatch. Once cancelled, reserved inventory will be released
              {cancelModal.order.payment_method === 'ONLINE' ? ' and a full refund will be automatically initiated to your original payment method.' : '.'}
            </p>

            <form onSubmit={handleConfirmCancelOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Reason for Cancellation *</label>
                <select
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Ordered by mistake / Duplicate order">Ordered by mistake / Duplicate order</option>
                  <option value="Estimated delivery time is too long">Estimated delivery time is too long</option>
                  <option value="Need to change shipping address or mobile">Need to change shipping address or mobile</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional Comments (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Tell us more about why you're cancelling..."
                  value={cancelModal.notes}
                  onChange={(e) => setCancelModal({ ...cancelModal, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={cancelModal.loading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {cancelModal.loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  type="button"
                  disabled={cancelModal.loading}
                  onClick={() => setCancelModal({ isOpen: false, order: null, reason: 'Changed my mind', notes: '', loading: false })}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Keep Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
