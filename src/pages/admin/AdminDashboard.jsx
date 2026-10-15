import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle, TrendingUp,
  CreditCard, Banknote, Truck, CheckCircle2, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const COLORS = ['#0284C7', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Executive Sales Dashboard" />

        <main className="p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-bold">Loading Executive Metrics...</div>
          ) : stats ? (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-extrabold uppercase tracking-wider">Total Sales</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{stats.metrics.totalSales.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-400">Today: ₹{stats.metrics.todaySales.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-extrabold uppercase tracking-wider">Total Orders</span>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats.metrics.totalOrders}
                  </div>
                  <p className="text-[11px] text-sky-600 font-semibold">{stats.metrics.pendingOrders} Pending Processing</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-extrabold uppercase tracking-wider">COD vs Online</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Banknote className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                    <span>{stats.metrics.codOrders} COD</span>
                    <span className="text-xs text-slate-400">/ {stats.metrics.onlineOrders} Online</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Payment Breakdown</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-extrabold uppercase tracking-wider">Low Stock Warning</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats.metrics.lowStockProducts} Products
                  </div>
                  <Link to="/admin/inventory" className="text-[11px] text-rose-600 font-bold hover:underline">
                    View Inventory Alerts →
                  </Link>
                </div>
              </div>

              {/* Status Counters Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                  <span className="text-lg font-black text-amber-600">{stats.metrics.pendingOrders}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Processing</span>
                  <span className="text-lg font-black text-sky-600">{stats.metrics.processingOrders}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Shipped</span>
                  <span className="text-lg font-black text-indigo-600">{stats.metrics.shippedOrders}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivered</span>
                  <span className="text-lg font-black text-emerald-600">{stats.metrics.deliveredOrders}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cancelled</span>
                  <span className="text-lg font-black text-rose-600">{stats.metrics.cancelledOrders}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Customers</span>
                  <span className="text-lg font-black text-slate-900">{stats.metrics.totalCustomers}</span>
                </div>
              </div>

              {/* Recharts Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-600" />
                    <span>Sales Revenue Trend (Last 7 Days)</span>
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.charts.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="#0284C7" fill="#0284C7" fillOpacity={0.15} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Breakdown Pie Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base">Category Revenue</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.charts.categorySales}
                          dataKey="sales"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.charts.categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Selling Products Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Top Performing Products</h3>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Product Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Units Sold</th>
                      <th className="p-3 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.charts.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{p.name}</td>
                        <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="p-3 text-center font-extrabold text-sky-600">{p.sold_qty}</td>
                        <td className="p-3 text-right font-black text-slate-900">₹{p.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
