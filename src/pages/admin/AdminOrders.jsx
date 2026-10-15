import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Search, Eye, Edit3, Truck, Printer, XCircle, Filter,
  CheckCircle2, Clock, Package, AlertTriangle, ArrowRight, Download,
  ExternalLink, MessageCircle, FileText, Check, ChevronRight
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import ShippingLabelModal from '../../components/admin/ShippingLabelModal';
import { api } from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [storeSettings, setStoreSettings] = useState({});
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected orders for Bulk Labels
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [labelModalOrders, setLabelModalOrders] = useState(null);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState(null);

  // Status Change Modal
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Admin Cancel Modal
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Out of stock');
  const [cancelNotes, setCancelNotes] = useState('');

  // Courier Tracking / Dispatch Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [autoMarkDispatched, setAutoMarkDispatched] = useState(true);

  // Toast message
  const [toast, setToast] = useState({ type: '', text: '' });

  useEffect(() => {
    loadOrders();
    loadCouriers();
  }, [statusFilter, paymentFilter, dateFrom, dateTo]);

  async function loadCouriers() {
    try {
      const res = await api.getCouriers();
      if (res.success && res.couriers) {
        setCouriers(res.couriers);
      }
    } catch (err) {
      console.error('Failed to load couriers:', err);
    }
  }

  async function loadOrders() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.getAdminOrders(params);
      if (res.success) {
        setOrders(res.orders);
        if (res.storeSettings) setStoreSettings(res.storeSettings);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- ORDER LIFECYCLE ACTIONS ---

  // 1. Accept Order
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await api.acceptOrder(orderId);
      if (res.success) {
        setToast({ type: 'success', text: res.message || `Order #${orderId} ACCEPTED!` });
        loadOrders();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to accept order.' });
    }
  };

  // 2. Open Cancel Modal for Admin
  const openCancelModal = (order) => {
    setCancelModalOrder(order);
    setCancelReason('Out of stock');
    setCancelNotes('');
  };

  const handleAdminCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    try {
      const res = await api.cancelOrderAdmin(cancelModalOrder.id, cancelReason, cancelNotes);
      if (res.success) {
        setToast({ type: 'success', text: res.message || `Order #${cancelModalOrder.id} cancelled.` });
        setCancelModalOrder(null);
        loadOrders();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to cancel order.' });
    }
  };

  // 3. Mark Packed
  const handleMarkPacked = async (orderId) => {
    try {
      const res = await api.markOrderPacked(orderId);
      if (res.success) {
        setToast({ type: 'success', text: `Order #${orderId} marked as PACKED.` });
        loadOrders();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to mark packed.' });
    }
  };

  // 4. Open Shipping / Dispatch Modal
  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setCourierName(order.courier_name || (couriers[0]?.name || 'Delhivery'));
    setSelectedCourierId(couriers[0]?.id || '');
    setTrackingNumber(order.tracking_number || '');
    setTrackingUrl(order.tracking_url || '');
    setEstDelivery(order.estimated_delivery || '');
    setAutoMarkDispatched(true);
  };

  // Update tracking URL automatically when courier or AWB changes
  const handleCourierSelect = (cName) => {
    setCourierName(cName);
    const courierObj = couriers.find(c => c.name.toLowerCase() === cName.toLowerCase());
    if (courierObj && trackingNumber) {
      setTrackingUrl(courierObj.tracking_url_template.replace('{TRACKING_NUMBER}', trackingNumber.trim()));
    }
  };

  const handleAwbChange = (awb) => {
    setTrackingNumber(awb);
    const courierObj = couriers.find(c => c.name.toLowerCase() === courierName.toLowerCase());
    if (courierObj && awb) {
      setTrackingUrl(courierObj.tracking_url_template.replace('{TRACKING_NUMBER}', awb.trim()));
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    if (!courierName || !trackingNumber) {
      alert('Courier Name and AWB Tracking Number are required.');
      return;
    }

    try {
      if (autoMarkDispatched) {
        await api.dispatchOrder(trackingModalOrder.id, {
          courier_name: courierName,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          estimated_delivery: estDelivery
        });
        setToast({ type: 'success', text: `Order #${trackingModalOrder.id} DISPATCHED via ${courierName}!` });
      } else {
        await api.updateOrderTracking(trackingModalOrder.id, {
          courier_name: courierName,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          estimated_delivery: estDelivery
        });
        setToast({ type: 'success', text: 'Tracking details updated.' });
      }
      setTrackingModalOrder(null);
      loadOrders();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to update courier details.' });
    }
  };

  // 5. Mark Delivered
  const handleMarkDelivered = async (orderId) => {
    if (window.confirm(`Mark Order #${orderId} as successfully DELIVERED?`)) {
      try {
        const res = await api.deliverOrder(orderId);
        if (res.success) {
          setToast({ type: 'success', text: `Order #${orderId} DELIVERED!` });
          loadOrders();
        }
      } catch (err) {
        setToast({ type: 'error', text: err.message || 'Failed to mark delivered.' });
      }
    }
  };

  // General Status Update Modal Submit
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalOrder) return;
    try {
      await api.updateOrderStatus(statusModalOrder.id, {
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
        adminNotes
      });
      setStatusModalOrder(null);
      setToast({ type: 'success', text: 'Order status updated successfully.' });
      loadOrders();
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update status.' });
    }
  };

  // Bulk Label Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleIds = filteredOrders
        .filter(o => o.is_accepted)
        .map(o => o.id);
      setSelectedOrderIds(eligibleIds);
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenBulkLabels = () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select at least one accepted order to print shipping labels.');
      return;
    }
    const selectedList = orders.filter(o => selectedOrderIds.includes(o.id));
    setLabelModalOrders(selectedList);
  };

  const handleSingleOrderLabel = (order) => {
    setLabelModalOrders([order]);
  };

  // Export CSV
  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);
    if (paymentFilter) query.set('paymentMethod', paymentFilter);
    if (dateFrom) query.set('dateFrom', dateFrom);
    if (dateTo) query.set('dateTo', dateTo);
    if (searchQuery) query.set('search', searchQuery);

    window.open(`/api/orders/admin/export-csv?${query.toString()}`, '_blank');
  };

  // WhatsApp Customer Notification generator
  const getWhatsAppLink = (order) => {
    const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    let text = `Hello ${order.customer_name}, updates regarding your TRENDYTOYZ Order #${order.id}:\n`;

    const status = (order.order_status || '').toUpperCase();
    if (status.includes('ACCEPT')) {
      text += `Your order has been ACCEPTED by our team and is currently being packed!`;
    } else if (status.includes('PACKED')) {
      text += `Your order has been securely PACKED and is ready for courier pickup.`;
    } else if (status.includes('DISPATCH') || status.includes('SHIPPED')) {
      text += `Your order has been DISPATCHED via ${order.courier_name || 'Courier'} (AWB: ${order.tracking_number || 'Pending'}). Track live at: ${order.tracking_url || `https://trendytoyz.com/track-order?orderId=${order.id}`}`;
    } else if (status.includes('DELIVERED')) {
      text += `Your order has been DELIVERED! We hope you love your purchase. Thank you for choosing TRENDYTOYZ!`;
    } else if (status.includes('CANCEL')) {
      text += `Your order has been cancelled. Reason: ${order.cancellation_reason || 'Cancelled'}.`;
    } else {
      text += `Current status: ${order.order_status}.`;
    }

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_phone.includes(searchQuery) ||
    (o.courier_name && o.courier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.tracking_number && o.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Order Fulfillment & Management" />

        <main className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Header Action Banner */}
          <div className="bg-navy-gradient text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black">Order Fulfillment Pipeline</h1>
              </div>
              <p className="text-xs text-slate-300">
                Workflow: <strong>Pending</strong> → <strong>Accept Order</strong> → <strong>Packed</strong> → <strong>Dispatch (Courier + AWB)</strong> → <strong>Delivered</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {selectedOrderIds.length > 0 && (
                <button
                  onClick={handleOpenBulkLabels}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print {selectedOrderIds.length} Shipping Label{selectedOrderIds.length > 1 ? 's' : ''}</span>
                </button>
              )}

              <button
                onClick={handleExportCsv}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Download className="w-4 h-4" /> Export Excel/CSV
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{toast.text}</span>
              </div>
              <button onClick={() => setToast({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700 text-base">
                ×
              </button>
            </div>
          )}

          {/* Search, Status Tabs & Date Filter Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              {[
                { label: 'All Orders', value: '' },
                { label: 'Pending Action', value: 'PENDING_ACTIONS' },
                { label: 'Accepted', value: 'Accepted' },
                { label: 'Packed', value: 'Packed' },
                { label: 'Dispatched', value: 'Dispatched' },
                { label: 'Delivered', value: 'Delivered' },
                { label: 'Cancelled', value: 'Cancelled by Admin' },
                { label: 'Customer Cancelled', value: 'Cancelled by Customer' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                    statusFilter === tab.value
                      ? 'bg-slate-900 text-white font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter controls row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer, Phone, AWB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Payment Modes</option>
                  <option value="ONLINE">Prepaid (Online)</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="shrink-0 text-[11px] font-bold">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="shrink-0 text-[11px] font-bold">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-bold">Loading Orders Pipeline...</div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.filter(o => o.is_accepted).length}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 rounded text-sky-600 cursor-pointer"
                          title="Select all accepted orders for bulk label printing"
                        />
                      </th>
                      <th className="p-3.5">Order ID & Date</th>
                      <th className="p-3.5">Customer & Destination</th>
                      <th className="p-3.5 text-right">Amount & Payment</th>
                      <th className="p-3.5 text-center">Order Status</th>
                      <th className="p-3.5 text-center">Logistics / Courier</th>
                      <th className="p-3.5 text-center">Status Action</th>
                      <th className="p-3.5 text-right">Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map(o => {
                      const addr = o.shipping_address || {};
                      const isPending = o.is_pending_acceptance;
                      const isAccepted = o.is_accepted;
                      const isDispatched = o.is_dispatched;
                      const isCancelled = (o.order_status || '').toUpperCase().includes('CANCEL');
                      const isDelivered = (o.order_status || '').toUpperCase() === 'DELIVERED';
                      const isSelected = selectedOrderIds.includes(o.id);

                      return (
                        <tr
                          key={o.id}
                          className={`hover:bg-slate-50 transition ${
                            isPending ? 'bg-amber-50/40' : isCancelled ? 'opacity-70 bg-slate-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              disabled={!isAccepted}
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(o.id)}
                              className="w-3.5 h-3.5 rounded text-sky-600 disabled:opacity-30 cursor-pointer"
                              title={isAccepted ? 'Select for bulk label download' : 'Order must be accepted before generating label'}
                            />
                          </td>

                          {/* Order ID & Date */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-black text-sky-600 text-sm block">{o.id}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(o.created_at).toLocaleDateString('en-IN', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {o.items?.length || 0} item{o.items?.length > 1 ? 's' : ''}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="p-3.5">
                            <span className="font-black text-slate-900 block leading-tight">{o.customer_name}</span>
                            <span className="text-[11px] font-mono text-slate-600 block">{o.customer_phone}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                              {addr.city ? `${addr.city}, ${addr.pincode}` : addr.street}
                            </span>
                          </td>

                          {/* Amount & Payment Mode */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm block">
                              ₹{Math.round(o.total_amount).toLocaleString('en-IN')}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 ${
                              o.payment_method === 'COD' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {o.payment_method} ({o.payment_status})
                            </span>
                          </td>

                          {/* Current Status Badge */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isDelivered ? 'bg-emerald-100 text-emerald-800' :
                              isCancelled ? 'bg-rose-100 text-rose-800' :
                              isDispatched ? 'bg-purple-100 text-purple-800' :
                              o.order_status === 'Packed' ? 'bg-indigo-100 text-indigo-800' :
                              o.order_status === 'Accepted' ? 'bg-sky-100 text-sky-800' :
                              'bg-amber-100 text-amber-900 animate-pulse'
                            }`}>
                              {o.order_status}
                            </span>
                          </td>

                          {/* Courier Tracking */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {o.courier_name ? (
                              <div>
                                <span className="font-extrabold text-slate-800 block text-xs">
                                  {o.courier_name}
                                </span>
                                {o.tracking_number ? (
                                  <span className="font-mono text-[10px] text-slate-500 font-bold block">
                                    {o.tracking_number}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No AWB</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Primary Lifecycle Actions */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleAcceptOrder(o.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition"
                                  title="Accept this order to start packing and fulfillment"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept Order
                                </button>
                                <button
                                  onClick={() => openCancelModal(o)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-2.5 py-1.5 rounded-xl text-xs transition"
                                  title="Cancel Order with reason"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : isCancelled ? (
                              <span className="text-[11px] text-rose-600 font-bold">
                                Cancelled
                              </span>
                            ) : o.order_status === 'Accepted' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleMarkPacked(o.id)}
                                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-[11px] shadow-xs transition"
                                >
                                  Mark Packed
                                </button>
                                <button
                                  onClick={() => openTrackingModal(o)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded-xl text-[11px] transition"
                                >
                                  Add Courier
                                </button>
                              </div>
                            ) : o.order_status === 'Packed' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openTrackingModal(o)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition"
                                >
                                  <Truck className="w-3.5 h-3.5" /> Dispatch Order
                                </button>
                              </div>
                            ) : isDispatched && !isDelivered ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleMarkDelivered(o.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] transition"
                                >
                                  Mark Delivered
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </td>

                          {/* Tools & Utilities */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Shipping Label (enabled only if accepted) */}
                              <button
                                onClick={() => handleSingleOrderLabel(o)}
                                disabled={!isAccepted}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isAccepted ? 'Download / Print Shipping Label' : 'Accept order first to print label'}
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Customer WhatsApp Notification button */}
                              <a
                                href={getWhatsAppLink(o)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Send Status Alert via WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>

                              {/* View Details Drawer */}
                              <button
                                onClick={() => setViewingOrder(o)}
                                className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition"
                                title="View Full Order Details & Timeline"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Invoice */}
                              <Link
                                to={`/invoice/${o.id}`}
                                target="_blank"
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                title="Open Tax Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-bold">
                No orders found matching the selected filters.
              </div>
            )}
          </div>

          {/* ================= MODAL 1: ORDER DETAILS & STATUS TIMELINE ================= */}
          {viewingOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full space-y-6 shadow-2xl my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Order Details #{viewingOrder.id}</h3>
                    <p className="text-xs text-slate-500">
                      Placed on {new Date(viewingOrder.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button onClick={() => setViewingOrder(null)} className="p-2 text-slate-400 hover:text-slate-700">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Customer & Shipping Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                      Customer Info
                    </span>
                    <p className="font-black text-slate-900 text-sm">{viewingOrder.customer_name}</p>
                    <p className="text-slate-600 font-mono mt-0.5">Phone: {viewingOrder.customer_phone}</p>
                    <p className="text-slate-600">Email: {viewingOrder.customer_email || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                      Delivery Address
                    </span>
                    <p className="text-slate-800 leading-snug">
                      {viewingOrder.shipping_address?.street || viewingOrder.shipping_address?.street_address}<br />
                      {viewingOrder.shipping_address?.landmark && `Landmark: ${viewingOrder.shipping_address.landmark}\n`}
                      {viewingOrder.shipping_address?.city}, {viewingOrder.shipping_address?.state} - <strong>{viewingOrder.shipping_address?.pincode}</strong>
                    </p>
                  </div>
                </div>

                {/* Status Timeline with Timestamps */}
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    Status Lifecycle & Timeline
                  </h4>

                  <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 ml-2">
                    {viewingOrder.history && viewingOrder.history.length > 0 ? (
                      viewingOrder.history.map((h, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                          <div>
                            <span className="font-black text-xs text-slate-900">{h.status}</span>
                            <span className="text-[11px] text-slate-400 ml-2 font-mono">
                              {new Date(h.created_at).toLocaleString('en-IN')}
                            </span>
                            {h.notes && (
                              <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Order placed on {new Date(viewingOrder.created_at).toLocaleString('en-IN')}</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Order Items</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3">
                    {viewingOrder.items?.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{it.product_name}</span>
                          <span className="text-slate-400 block text-[11px]">SKU: {it.sku} | Qty: {it.quantity}</span>
                        </div>
                        <span className="font-extrabold text-slate-900">₹{it.total.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-sky-600">₹{viewingOrder.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <a
                    href={getWhatsAppLink(viewingOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Send WhatsApp Alert</span>
                  </a>

                  <div className="flex items-center gap-2">
                    {viewingOrder.is_accepted && (
                      <button
                        onClick={() => {
                          setLabelModalOrders([viewingOrder]);
                          setViewingOrder(null);
                        }}
                        className="bg-navy-gradient text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" /> Print Label
                      </button>
                    )}
                    <button
                      onClick={() => setViewingOrder(null)}
                      className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL 2: ADMIN CANCEL ORDER WITH REASON ================= */}
          {cancelModalOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="font-black text-slate-900 text-base">Cancel Order #{cancelModalOrder.id}</h3>
                </div>

                <p className="text-xs text-slate-500">
                  Cancelling will restore inventory stock to products, mark refund as initiated if prepaid, and record the reason in the order history.
                </p>

                <form onSubmit={handleAdminCancelSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cancellation Reason *</label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Out of stock / Inventory shortage">Out of stock / Inventory shortage</option>
                      <option value="Customer requested cancellation">Customer requested cancellation</option>
                      <option value="Undeliverable pincode / Address issue">Undeliverable pincode / Address issue</option>
                      <option value="Pricing error or invalid promotion applied">Pricing error or invalid promotion applied</option>
                      <option value="Suspected fraudulent / fake COD order">Suspected fraudulent / fake COD order</option>
                      <option value="Logistics / Courier service unavailable">Logistics / Courier service unavailable</option>
                      <option value="Other reason">Other reason (specify below)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Additional Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Add details for the customer / audit log..."
                      value={cancelNotes}
                      onChange={(e) => setCancelNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl text-xs shadow-md transition"
                    >
                      Confirm Order Cancellation
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelModalOrder(null)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL 3: ADD COURIER & DISPATCH ORDER ================= */}
          {trackingModalOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-sky-600" />
                    <h3 className="font-black text-slate-900 text-base">
                      Dispatch Order #{trackingModalOrder.id}
                    </h3>
                  </div>
                  <button onClick={() => setTrackingModalOrder(null)} className="text-slate-400 hover:text-slate-700">
                    ×
                  </button>
                </div>

                <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select Courier Partner *</label>
                    <select
                      value={courierName}
                      onChange={(e) => handleCourierSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      {couriers.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Self / Local Courier">Self / Local Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">AWB / Tracking Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={trackingNumber}
                      onChange={(e) => handleAwbChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Live Tracking URL</label>
                    <input
                      type="url"
                      placeholder="https://track.courier.com/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Auto-generated from courier template. Customer can track in 1-click.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimated Delivery Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Business Days / 18 Oct"
                      value={estDelivery}
                      onChange={(e) => setEstDelivery(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoMarkDispatched}
                        onChange={(e) => setAutoMarkDispatched(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span className="font-extrabold text-slate-900">
                        Mark status as DISPATCHED immediately upon save
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-black py-2.5 rounded-xl text-xs shadow-md transition"
                    >
                      {autoMarkDispatched ? 'Save & Mark Dispatched' : 'Save Tracking'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(null)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL 4: SHIPPING LABEL (SINGLE OR BULK) ================= */}
          {labelModalOrders && (
            <ShippingLabelModal
              orders={labelModalOrders}
              storeSettings={storeSettings}
              onClose={() => setLabelModalOrders(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
