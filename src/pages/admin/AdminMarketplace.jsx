import React, { useState, useEffect } from 'react';
import { ExternalLink, Edit3, Save } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected for edit modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [flipkartUrl, setFlipkartUrl] = useState('');
  const [meeshoUrl, setMeeshoUrl] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setAmazonUrl(p.amazon_url || '');
    setFlipkartUrl(p.flipkart_url || '');
    setMeeshoUrl(p.meesho_url || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        ...editingProduct,
        amazon_url: amazonUrl,
        flipkart_url: flipkartUrl,
        meesho_url: meeshoUrl
      });
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      alert('Failed to save marketplace links.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Marketplace Integration Links" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-sm">Product Marketplace Links (Amazon, Flipkart, Meesho)</h3>
            <p className="text-xs text-slate-500">Configure external buy links per product. TRENDYTOYZ remains the primary order platform.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-bold">Loading Product Links...</div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5 text-center">Amazon Link</th>
                    <th className="p-3.5 text-center">Flipkart Link</th>
                    <th className="p-3.5 text-center">Meesho Link</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-extrabold text-slate-900">{p.name}</td>
                      <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                      <td className="p-3.5 text-center">
                        {p.amazon_url ? (
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">Configured</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {p.flipkart_url ? (
                          <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Configured</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {p.meesho_url ? (
                          <span className="bg-pink-100 text-pink-900 px-2 py-0.5 rounded font-bold">Configured</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="bg-navy-gradient text-white font-bold px-3 py-1 rounded-lg text-[11px]"
                        >
                          Configure Links
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-slate-900 text-base">Configure Marketplace URLs</h3>
                <p className="text-xs text-slate-500">{editingProduct.name}</p>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">Amazon URL</label>
                    <input
                      type="url"
                      placeholder="https://www.amazon.in/dp/..."
                      value={amazonUrl}
                      onChange={(e) => setAmazonUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-blue-900 block mb-1">Flipkart URL</label>
                    <input
                      type="url"
                      placeholder="https://www.flipkart.com/item/..."
                      value={flipkartUrl}
                      onChange={(e) => setFlipkartUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-pink-900 block mb-1">Meesho URL</label>
                    <input
                      type="url"
                      placeholder="https://meesho.com/s/item/..."
                      value={meeshoUrl}
                      onChange={(e) => setMeeshoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-bold py-2.5 rounded-xl text-xs"
                    >
                      Save Links
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
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
