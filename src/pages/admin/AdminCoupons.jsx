import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit3 } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id: null,
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '499',
    max_discount: '250',
    usage_limit: '100',
    is_active: true
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const res = await api.getCoupons();
      if (res.success) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setForm({
      id: null,
      code: '',
      discount_type: 'percentage',
      discount_value: '10',
      min_order_amount: '499',
      max_discount: '250',
      usage_limit: '100',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setForm({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount || 0),
      max_discount: String(c.max_discount || 0),
      usage_limit: String(c.usage_limit || 100),
      is_active: c.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id, code) => {
    if (window.confirm(`Delete coupon "${code}"?`)) {
      try {
        await api.deleteCoupon(id);
        loadCoupons();
      } catch (err) {
        alert('Failed to delete coupon.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.updateCoupon(form.id, form);
      } else {
        await api.createCoupon(form);
      }
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Error saving coupon.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Coupons & Promotional Discounts" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Discount Coupons ({coupons.length})</h3>
              <p className="text-xs text-slate-500">Manage promo codes, percentage discounts & order limits</p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Create Coupon Code
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-bold">Loading Coupons...</div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Coupon Code</th>
                    <th className="p-3.5">Discount Type</th>
                    <th className="p-3.5">Discount Value</th>
                    <th className="p-3.5 text-right">Min Order</th>
                    <th className="p-3.5 text-right">Max Discount Cap</th>
                    <th className="p-3.5 text-center">Used / Limit</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-black text-sky-600 text-sm">{c.code}</td>
                      <td className="p-3.5 capitalize font-semibold text-slate-700">{c.discount_type}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-700">₹{c.min_order_amount}</td>
                      <td className="p-3.5 text-right font-bold text-slate-700">₹{c.max_discount || 'No Cap'}</td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{c.used_count} / {c.usage_limit}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.is_active === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {c.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Form */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {form.id ? 'Edit Coupon Code' : 'Create New Coupon'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Coupon Code (Uppercase) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TRENDY10"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</label>
                      <select
                        value={form.discount_type}
                        onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Discount Value *</label>
                      <input
                        type="number"
                        required
                        placeholder="10 or 200"
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Min Order Value (₹)</label>
                      <input
                        type="number"
                        value={form.min_order_amount}
                        onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        value={form.max_discount}
                        onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-bold py-2.5 rounded-xl text-xs"
                    >
                      Save Coupon
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
