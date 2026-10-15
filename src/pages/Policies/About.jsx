import React from 'react';
import { ShieldCheck, Award, Heart, Truck } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="bg-sky-100 text-sky-800 text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wider">
          About TRENDYTOYZ
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Redefining Quality Toys & Play in India
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          TRENDYTOYZ is a premier shopping platform bringing together high-quality educational toys, creative games, and play essentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Uncompromising Quality</h3>
          <p className="text-xs text-slate-500">Every single product undergoes multi-tier quality inspection before dispatch.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">100% Authentic Brands</h3>
          <p className="text-xs text-slate-500">Direct sourcing guarantees genuine materials, non-toxic plastics & 100% top-grain leather.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Pan-India Express COD</h3>
          <p className="text-xs text-slate-500">Delivering to 26,000+ pincodes across India with secure Online Payment & Cash on Delivery options.</p>
        </div>
      </div>
    </div>
  );
}
