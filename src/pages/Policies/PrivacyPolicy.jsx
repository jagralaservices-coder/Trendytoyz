import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-slate-800 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
      <p className="text-xs text-slate-400">Last updated: October 2026</p>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base">1. Information We Collect</h3>
        <p>
          At TRENDYTOYZ, we collect personal information necessary to fulfill your ecommerce transactions, including your full name, shipping address, mobile number, and email address.
        </p>

        <h3 className="font-bold text-slate-900 text-base">2. Payment Security</h3>
        <p>
          Online transactions on TRENDYTOYZ are processed via 256-bit SSL encrypted payment gateways (such as Razorpay / PhonePe). We do not store credit/debit card details, PINs, or banking passwords on our servers.
        </p>

        <h3 className="font-bold text-slate-900 text-base">3. Use of Information</h3>
        <p>
          Your information is solely utilized to process orders, send real-time SMS/WhatsApp delivery updates, calculate courier rates, and handle customer service requests.
        </p>
      </div>
    </div>
  );
}
