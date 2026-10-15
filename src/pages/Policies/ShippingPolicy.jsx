import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-800 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shipping & Dispatch Policy</h1>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base">Delivery Timelines</h3>
        <p>Orders are dispatched within 24 hours. Standard delivery timeline across India is 3 to 6 business days depending on pincode serviceability.</p>
        <h3 className="font-bold text-slate-900 text-base">Free Shipping Threshold</h3>
        <p>Orders above ₹799 qualify for FREE Express Shipping. Orders below ₹799 incur a nominal ₹49 shipping charge.</p>
      </div>
    </div>
  );
}
