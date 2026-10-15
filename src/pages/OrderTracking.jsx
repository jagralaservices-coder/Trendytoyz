import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Truck, CheckCircle2, Clock, ExternalLink, Package, AlertCircle, Copy, Check, Info, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [identifier, setIdentifier] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedAwb, setCopiedAwb] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      // Auto submit if orderId is in URL
      handleTrackQuery(initialOrderId, '');
    }
  }, [initialOrderId]);

  async function handleTrackQuery(idToTrack, phoneOrEmail) {
    if (!idToTrack) return;
    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const data = await api.trackOrder(idToTrack, phoneOrEmail || '');
      if (data.success && data.order) {
        setTrackingData(data.order);
      } else {
        setError(data.error || 'Order tracking details not found.');
      }
    } catch (err) {
      setError(err.message || 'Could not find order. Please verify your Order ID.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId) {
      setError('Please enter your Order ID.');
      return;
    }
    handleTrackQuery(orderId, identifier);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Tracking Header Banner */}
      <div className="bg-navy-gradient text-white rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xl border border-slate-800">
        <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Track Your TRENDYTOYZ Order</h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
          Enter your unique Order ID to view real-time packaging, courier dispatch status, and live parcel tracking.
        </p>
      </div>

      {/* Tracking Input Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">Order ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. TTZ-20261015-0001"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mobile or Email <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Registered Phone or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {trackingData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Order Details Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Order ID</span>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-mono">{trackingData.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Order Date</span>
              <span className="font-bold text-slate-800">
                {new Date(trackingData.order_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Payment</span>
              <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[11px] mt-0.5 ${
                trackingData.payment_status === 'PAID' || trackingData.payment_status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : trackingData.payment_status === 'REFUND INITIATED'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {trackingData.payment_status} ({trackingData.payment_method})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Current Status</span>
              <span className={`font-extrabold text-xs sm:text-sm mt-0.5 block ${
                trackingData.order_status.toUpperCase().includes('CANCEL')
                  ? 'text-rose-600'
                  : trackingData.order_status === 'DELIVERED'
                  ? 'text-emerald-600'
                  : 'text-sky-600'
              }`}>
                {trackingData.order_status}
              </span>
            </div>
          </div>

          {/* Cancellation Notice if applicable */}
          {trackingData.order_status.toUpperCase().includes('CANCEL') && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Order Cancelled</p>
                <p className="text-slate-600 mt-0.5">
                  Reason: {trackingData.cancellation_reason || 'Order cancelled as requested.'}
                </p>
                {trackingData.payment_method === 'PREPAID' && (
                  <p className="text-rose-700 font-semibold mt-1">
                    Refund status: {trackingData.payment_status || 'Refund Initiated'} (processed back to original payment method).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Courier & Tracking Details Card */}
          {trackingData.courier_name && trackingData.tracking_number ? (
            <div className="bg-gradient-to-br from-sky-50 via-sky-50/50 to-white border-2 border-sky-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                      Dispatched via Courier
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {trackingData.courier_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-semibold">AWB / Tracking Number:</span>
                    <span className="font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                      {trackingData.tracking_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(trackingData.tracking_number)}
                      className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition"
                      title="Copy AWB number"
                    >
                      {copiedAwb ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {copiedAwb && <span className="text-[11px] font-bold text-emerald-600">Copied!</span>}
                  </div>
                  {trackingData.estimated_delivery && (
                    <p className="text-xs text-sky-800 font-semibold">
                      Estimated Delivery: <strong>{trackingData.estimated_delivery}</strong>
                    </p>
                  )}
                  {trackingData.dispatch_date && (
                    <p className="text-[11px] text-slate-500">
                      Dispatched on: {new Date(trackingData.dispatch_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>

                {trackingData.tracking_url && (
                  <a
                    href={trackingData.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs shadow-md shrink-0"
                  >
                    <span>Track on Courier Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ) : !trackingData.order_status.toUpperCase().includes('CANCEL') ? (
            /* When courier tracking is not yet assigned */
            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl flex items-start sm:items-center gap-3.5 text-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Your order is being prepared</h4>
                <p className="text-slate-600 mt-0.5">
                  Our fulfillment team at TRENDYTOYZ is carefully packing and verifying your toy order. 
                  Live courier tracking details (AWB number & partner link) will appear here as soon as the package is dispatched.
                </p>
              </div>
            </div>
          ) : null}

          {/* Visual Milestone Timeline */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
              Order Timeline
            </h3>

            <div className="relative border-l-2 border-slate-200 pl-6 space-y-6 ml-2 my-4">
              {trackingData.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow ${
                    item.isCancelled
                      ? 'bg-rose-500 text-white ring-4 ring-rose-100 font-bold'
                      : item.current
                      ? 'bg-sky-500 text-white ring-4 ring-sky-100 font-bold'
                      : item.completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {item.isCancelled ? '✕' : item.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${
                      item.isCancelled ? 'text-rose-700 font-black' : item.completed ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {item.label}
                    </h4>
                    {item.notes && (
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.notes}</p>
                    )}
                    {item.timestamp && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered Products Preview */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Order Items</h4>
            <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              {trackingData.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{it.product_name}</span>
                    <span className="text-slate-400 text-[11px]">
                      SKU: {it.sku || 'N/A'} • Qty: {it.quantity}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900">₹{it.total?.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount</span>
                <span>₹{trackingData.total_amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Cancellation & No-Return Policy Reminder */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>TRENDYTOYZ Cancellation Policy:</strong> Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned. For damaged or wrong toy items received, please contact support within 48 hours with an unboxing video.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

