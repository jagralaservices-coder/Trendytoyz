import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function Invoice() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await api.getInvoice(id);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Invoice load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Tax Invoice...</div>;
  }

  if (!data || !data.order) {
    return <div className="p-8 text-center text-rose-500 font-bold">Invoice Not Found</div>;
  }

  const { order, store } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-100 min-h-screen py-8 px-4">
      {/* Action Buttons bar (hidden in print) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-end gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF Invoice
        </button>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-lg space-y-8 text-slate-900 font-sans print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-gradient text-white font-black flex items-center justify-center text-base">
                TT
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                TRENDY<span className="text-sky-600">TOYZ</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs leading-snug">{store.business_address}</p>
            <p className="text-xs text-slate-500">GSTIN: <strong className="text-slate-800 font-mono">{store.gstin}</strong></p>
            <p className="text-xs text-slate-500">Email: {store.support_email} | Phone: {store.support_phone}</p>
          </div>

          <div className="text-right space-y-1">
            <span className="bg-sky-100 text-sky-800 text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider">
              TAX INVOICE
            </span>
            <h3 className="font-extrabold text-slate-900 text-base mt-2">Invoice #{order.id}</h3>
            <p className="text-xs text-slate-500">
              Date: {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Customer / Bill To</h4>
            <p className="font-extrabold text-slate-900 text-sm">{order.customer_name}</p>
            <p className="text-slate-600">Phone: {order.customer_phone}</p>
            <p className="text-slate-600">Email: {order.customer_email || 'N/A'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Ship To Address</h4>
            <p className="text-slate-700 leading-snug">
              {order.shipping_address.street}<br />
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
            </p>
          </div>
        </div>

        {/* Order Payment Summary badges */}
        <div className="flex items-center justify-between text-xs bg-sky-50 p-3 rounded-xl border border-sky-100">
          <div>
            Payment Method: <strong className="text-slate-900 uppercase font-bold">{order.payment_method}</strong>
          </div>
          <div>
            Payment Status: <strong className="text-emerald-700 uppercase font-bold">{order.payment_status}</strong>
          </div>
          <div>
            Order Status: <strong className="text-sky-700 uppercase font-bold">{order.order_status}</strong>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="p-3 rounded-l-lg">Item / Product Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right rounded-r-lg">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 font-semibold text-slate-900">
                  {item.product_name} {item.variant && <span className="text-slate-500 text-[10px]">({item.variant})</span>}
                </td>
                <td className="p-3 text-slate-500 font-mono">{item.sku}</td>
                <td className="p-3 text-center font-bold">{item.quantity}</td>
                <td className="p-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-extrabold text-slate-900">₹{item.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Calculations */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Applied:</span>
                <span>- ₹{order.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Shipping Charge:</span>
              <span className="font-bold text-slate-900">
                {order.shipping_charge === 0 ? 'FREE' : `₹${order.shipping_charge}`}
              </span>
            </div>

            {order.cod_charge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>COD Charge:</span>
                <span className="font-bold text-slate-900">₹{order.cod_charge}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>GST Included (18%):</span>
              <span className="font-bold text-slate-900">₹{Math.round((order.subtotal * 18) / 118).toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-slate-300 pt-2 flex justify-between items-baseline font-black text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-lg text-sky-600">₹{order.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Official Terms & Cancellation Policy Notice */}
        <div className="border-t border-slate-200 pt-4 text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl border">
          <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">
            Terms & Conditions & Return Policy:
          </h5>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            1. <strong>Cancellation & Return Policy:</strong> Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.
          </p>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            2. <strong>Damaged / Incorrect Delivery:</strong> In the exceptional case of transit damage or wrong item received, customer must report within 48 hours of delivery along with unboxing video/photo proof to {store.support_email || 'support@jgrl.co'}.
          </p>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            3. All disputes subject to Mumbai, Maharashtra jurisdiction.
          </p>
        </div>

        {/* Footer Authorization Notice */}
        <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-500">
          <div>
            Computer generated Tax Invoice. Registered under GST Act.
          </div>
          <div className="font-bold text-slate-700">
            Authorized Signatory for {store.brand_name || 'TRENDYTOYZ'}
          </div>
        </div>
      </div>
    </div>
  );
}
