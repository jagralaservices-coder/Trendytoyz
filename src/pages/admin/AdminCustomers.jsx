import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await api.updateCustomerStatus(id, newStatus);
      loadCustomers();
    } catch (err) {
      alert('Failed to update customer status.');
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Customer Directory" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search customers by Name, Email or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-xs font-bold text-slate-500">Total Customers: {customers.length}</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-bold">Loading Customer Data...</div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Mobile Phone</th>
                    <th className="p-3.5 text-center">Total Orders</th>
                    <th className="p-3.5 text-right">Total Spending</th>
                    <th className="p-3.5 text-center">Account Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-extrabold text-slate-900">{c.name}</td>
                      <td className="p-3.5 text-slate-600">{c.email}</td>
                      <td className="p-3.5 font-mono text-slate-600">{c.phone || 'N/A'}</td>
                      <td className="p-3.5 text-center font-bold text-sky-600">{c.total_orders}</td>
                      <td className="p-3.5 text-right font-extrabold text-slate-900">
                        ₹{c.total_spend.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                            c.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.status === 'active' ? 'Block Customer' : 'Unblock Account'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
