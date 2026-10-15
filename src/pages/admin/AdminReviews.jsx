import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Trash2, CheckCircle, EyeOff } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await api.getAdminReviews();
      if (res.success) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleModerate = async (id, status) => {
    try {
      await api.moderateReview(id, status);
      loadReviews();
    } catch (err) {
      alert('Failed to update review status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete review permanently?')) {
      try {
        await api.deleteReview(id);
        loadReviews();
      } catch (err) {
        alert('Failed to delete review.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Customer Review Moderation" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Product Reviews ({reviews.length})</h3>
              <p className="text-xs text-slate-500">Approve, hide or moderate verified customer ratings</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-bold">Loading Customer Reviews...</div>
            ) : reviews.length > 0 ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5 text-center">Rating</th>
                    <th className="p-3.5">Review Comment</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-extrabold text-slate-900">{r.product_name}</td>
                      <td className="p-3.5 font-bold text-slate-700">{r.user_name}</td>
                      <td className="p-3.5 text-center font-extrabold text-amber-500">
                        {r.rating} ★
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-sm">{r.comment}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status !== 'approved' ? (
                            <button
                              onClick={() => handleModerate(r.id, 'approved')}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerate(r.id, 'hidden')}
                              className="text-slate-500 hover:text-slate-700 font-bold text-xs"
                            >
                              Hide
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 font-bold">No product reviews submitted yet.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
