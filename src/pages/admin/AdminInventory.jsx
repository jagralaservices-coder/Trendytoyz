import React, { useState, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, Edit, RefreshCw } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock edit state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    try {
      const res = await api.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.updateProduct(selectedProduct.id, {
        ...selectedProduct,
        stock_quantity: parseInt(newStock)
      });
      setSelectedProduct(null);
      loadInventory();
    } catch (err) {
      alert('Failed to update stock.');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Inventory Management" />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Filter inventory by Name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={loadInventory}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Stock
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-bold">Loading Inventory Overview...</div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Selling Price</th>
                    <th className="p-3.5 text-center">Current Stock</th>
                    <th className="p-3.5 text-center">Stock Threshold</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-600 font-bold">{p.sku}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">{p.name}</td>
                      <td className="p-3.5 text-slate-600">{p.category_name}</td>
                      <td className="p-3.5 text-right font-extrabold text-slate-900">₹{p.selling_price}</td>
                      <td className="p-3.5 text-center font-extrabold text-sm">
                        <span className={p.stock_quantity <= p.low_stock_threshold ? 'text-rose-600' : 'text-emerald-700'}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-500">{p.low_stock_threshold}</td>
                      <td className="p-3.5 text-center">
                        {p.stock_quantity <= 0 ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Out of Stock
                          </span>
                        ) : p.stock_quantity <= p.low_stock_threshold ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setNewStock(String(p.stock_quantity));
                          }}
                          className="bg-navy-gradient text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-xs"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Stock Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-slate-900 text-base">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-500">{selectedProduct.name} ({selectedProduct.sku})</p>

                <form onSubmit={handleUpdateStock} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">New Stock Count</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-bold py-2.5 rounded-xl text-xs"
                    >
                      Save Quantity
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
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
