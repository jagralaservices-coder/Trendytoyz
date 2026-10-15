import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Warehouse, ShoppingCart, Users,
  Truck, Tag, MessageSquare, Image, ExternalLink, BarChart3, Settings,
  LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Inventory', path: '/admin/inventory', icon: Warehouse },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Shipping & Tracking', path: '/admin/shipping', icon: Truck },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Banners', path: '/admin/banners', icon: Image },
    { label: 'Marketplace Links', path: '/admin/marketplace', icon: ExternalLink },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-slate-950 font-black flex items-center justify-center text-base">
            TT
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight leading-none block">
              TRENDY<span className="text-sky-400">TOYZ</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-sky-400 hover:underline px-3 py-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View Live Customer Website
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="w-full flex items-center gap-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Logout Admin
        </button>
      </div>
    </aside>
  );
}
