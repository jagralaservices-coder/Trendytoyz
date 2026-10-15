import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-800 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Return & Refund Policy</h1>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base">7-Day Replacement Guarantee</h3>
        <p>If you receive a damaged, defective or incorrect product, you may request a replacement or return within 7 days of delivery.</p>
        <h3 className="font-bold text-slate-900 text-base">Refund Process</h3>
        <p>Refunds for online payment orders will be processed back to the original source bank account within 5-7 working days after receipt of the returned item.</p>
      </div>
    </div>
  );
}
