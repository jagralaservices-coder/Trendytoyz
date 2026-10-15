import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-800 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <p>Welcome to TRENDYTOYZ. By browsing or purchasing from our platform, you agree to comply with our commercial terms.</p>
        <h3 className="font-bold text-slate-900 text-base">1. Orders & Pricing</h3>
        <p>All prices listed are in Indian Rupees (INR) and inclusive of applicable GST taxes. We reserve the right to cancel orders in case of obvious typographical errors or inventory stock-outs.</p>
        <h3 className="font-bold text-slate-900 text-base">2. Cash on Delivery (COD) Rules</h3>
        <p>For Cash on Delivery orders, customers are expected to make full payment upon delivery. Verification calls or OTPs may be conducted prior to dispatch.</p>
      </div>
    </div>
  );
}
