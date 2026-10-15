import React, { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Printer, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const isCod = location.state?.cod || false;

  useEffect(() => {
    // Launch celebratory confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 text-center">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-3">
        <span className="bg-emerald-500/10 text-emerald-700 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
          Order Successfully Confirmed
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Thank You For Your Order!
        </h1>

        <p className="text-slate-600 text-base max-w-md mx-auto">
          {isCod ? (
            <strong className="text-slate-900 block font-bold text-lg">
              "Your COD order has been successfully placed."
            </strong>
          ) : (
            'Your payment has been verified and your order is now being processed by our team.'
          )}
        </p>

        <div className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-mono font-bold shadow-md">
          Order ID: <span className="text-sky-400">{id}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 text-left shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <Truck className="w-5 h-5 text-sky-600" />
          <span>What Happens Next?</span>
        </h3>

        <ol className="space-y-3 text-xs text-slate-700">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">1</span>
            <span>Our warehouse packages your items securely with tamper-evident seals.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">2</span>
            <span>Once shipped, courier AWB tracking number will be assigned and updated live.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">3</span>
            <span>You can track live status anytime on our portal using your Order ID and Phone Number.</span>
          </li>
        </ol>

        {/* Cancellation & No-Return Policy Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 mt-4 space-y-1">
          <span className="font-extrabold block text-amber-900">
            Cancellation & No-Return Notice:
          </span>
          <p className="text-[11px] leading-relaxed text-amber-900">
            <strong>Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to={`/track-order?orderId=${encodeURIComponent(id)}`}
          className="w-full sm:w-auto bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <Package className="w-4 h-4 text-sky-400" />
          <span>Track My Order</span>
        </Link>

        <Link
          to={`/invoice/${id}`}
          target="_blank"
          className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>View / Download Invoice</span>
        </Link>
      </div>
    </div>
  );
}
