import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Bell, User } from 'lucide-react';

export default function AdminHeader({ title = 'Dashboard' }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500">TRENDYTOYZ Ecommerce Management Control System</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-extrabold text-slate-800">{user?.email || 'trendytoys.info@gmail.com'}</span>
          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.2 rounded uppercase">ADMIN</span>
        </div>
      </div>
    </header>
  );
}
