import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit3, Trash2, Copy, Eye, Power, AlertTriangle,
  ExternalLink, Banknote, Archive, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, DollarSign, Filter, Layers
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStock, setFilterStock] = useState(''); // 'low', 'out', 'in'
  const [filterStatus, setFilterStatus] = useState(''); // 'active', 'disabled', 'archived'
  const [categories, setCategories] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk Price Update Modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState({
    type: 'percentage', // 'percentage' | 'fixed'
    value: '10',
    direction: 'increase' // 'increase' | 'decrease'
  });

  // Toast
  const [toast, setToast] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProducts();
    api.getAdminCategories().then(res => {
      if (res.success) setCategories(res.categories);
    }).catch(console.error);
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ Archive product "${name}"?\n\n• The product will be hidden from the public store.\n• Customer order history and sales reports are 100% PRESERVED.\n• You can unarchive or restore this product at any time.`)) {
      try {
        await api.deleteProduct(id, true);
        setToast({ type: 'success', text: `Product "${name}" safely archived. Order history preserved.` });
        loadProducts();
      } catch (err) {
        setToast({ type: 'error', text: err.message || 'Failed to archive product.' });
      }
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await api.restoreProduct(id);
      setToast({ type: 'success', text: `Product "${name}" restored to active catalog!` });
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to restore product.' });
    }
  };

  const handleArchiveToggle = async (id, name) => {
    try {
      const res = await api.archiveProduct(id);
      if (res.success) {
        setToast({ type: 'success', text: res.message });
        loadProducts();
      }
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update archive status.' });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.duplicateProduct(id);
      if (res.success) {
        setToast({ type: 'success', text: 'Product duplicated successfully!' });
        loadProducts();
      }
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to duplicate product.' });
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateProduct(product.id, { ...product, status: newStatus });
      setToast({ type: 'success', text: `Product status changed to ${newStatus}.` });
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to update status.' });
    }
  };

  const handleToggleCod = async (product) => {
    try {
      const res = await api.toggleProductCod(product.id);
      if (res.success) {
        setToast({ type: 'success', text: res.message });
        loadProducts();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to toggle COD.' });
    }
  };

  // --- BULK ACTIONS ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.bulkUpdateProductStatus(selectedIds, targetStatus);
      if (res.success) {
        setToast({ type: 'success', text: res.message });
        setSelectedIds([]);
        loadProducts();
      }
    } catch (err) {
      setToast({ type: 'error', text: 'Bulk status update failed.' });
    }
  };

  const handleBulkDelete = async (softDelete = true) => {
    if (selectedIds.length === 0) return;
    const msg = softDelete
      ? `Archive (soft delete) ${selectedIds.length} selected products?`
      : `PERMANENTLY delete ${selectedIds.length} selected products? This cannot be undone!`;

    if (window.confirm(msg)) {
      try {
        const res = await api.bulkDeleteProducts(selectedIds, softDelete);
        if (res.success) {
          setToast({ type: 'success', text: res.message });
          setSelectedIds([]);
          loadProducts();
        }
      } catch (err) {
        setToast({ type: 'error', text: 'Bulk delete failed.' });
      }
    }
  };

  const handleBulkPriceSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    try {
      const res = await api.bulkUpdateProductPrices(
        selectedIds,
        priceAdjustment.type,
        priceAdjustment.value,
        priceAdjustment.direction
      );
      if (res.success) {
        setToast({ type: 'success', text: res.message });
        setShowPriceModal(false);
        setSelectedIds([]);
        loadProducts();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Bulk price update failed.' });
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCat = !filterCat || p.category_id === parseInt(filterCat) || p.category_slug === filterCat;

    let matchesStock = true;
    if (filterStock === 'out') matchesStock = p.stock_quantity <= 0;
    else if (filterStock === 'low') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
    else if (filterStock === 'in') matchesStock = p.stock_quantity > (p.low_stock_threshold || 5);

    let matchesStatus = true;
    if (filterStatus) matchesStatus = p.status === filterStatus;

    return matchesSearch && matchesCat && matchesStock && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const lowStockCount = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5) && p.status !== 'archived').length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Product Inventory & Catalog" />

        <main className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Header Action Banner */}
          <div className="bg-navy-gradient text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-black">Product Management</h1>
              <p className="text-xs text-slate-300">
                Create, update, soft-delete / archive, manage images, low-stock alerts and bulk updates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {lowStockCount > 0 && (
                <button
                  onClick={() => setFilterStock('low')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{lowStockCount} Low Stock Alert{lowStockCount > 1 ? 's' : ''}</span>
                </button>
              )}

              <button
                onClick={() => navigate('/admin/products/new')}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{toast.text}</span>
              </div>
              <button onClick={() => setToast({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>
          )}

          {/* Search & Multi-Filters Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Name, SKU, or Tag..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div>
                <select
                  value={filterCat}
                  onChange={(e) => { setFilterCat(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterStock}
                  onChange={(e) => { setFilterStock(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Stock Levels</option>
                  <option value="in">Healthy Stock (&gt; Threshold)</option>
                  <option value="low">⚠️ Low Stock (≤ Threshold)</option>
                  <option value="out">❌ Out of Stock (0 Left)</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Products</option>
                  <option value="disabled">Disabled Products</option>
                  <option value="archived">Archived (Soft Deleted)</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Controls Bar (Visible when items selected) */}
            {selectedIds.length > 0 && (
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="font-extrabold text-sky-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>{selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowPriceModal(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Bulk Price Update
                  </button>

                  <button
                    onClick={() => handleBulkStatusChange('active')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                  >
                    Activate
                  </button>

                  <button
                    onClick={() => handleBulkStatusChange('disabled')}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                  >
                    Deactivate
                  </button>

                  <button
                    onClick={() => handleBulkDelete(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                    title="Soft delete / archive selected products"
                  >
                    Archive
                  </button>

                  <button
                    onClick={() => handleBulkDelete(false)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                    title="Permanently remove selected products"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-bold">Loading Products Catalog...</div>
            ) : paginatedProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedProducts.length}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 rounded text-sky-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">Product & SKU</th>
                      <th className="p-3.5">Category & Age Group</th>
                      <th className="p-3.5 text-right">MRP / Selling</th>
                      <th className="p-3.5 text-center">Stock Status</th>
                      <th className="p-3.5 text-center">COD Availability</th>
                      <th className="p-3.5 text-center">Catalog Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map(p => {
                      const isLowStock = p.stock_quantity <= (p.low_stock_threshold || 5);
                      const isOutOfStock = p.stock_quantity <= 0;
                      const isArchived = p.is_archived || p.status === 'archived';

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 transition ${
                            isArchived ? 'opacity-60 bg-slate-50' : isOutOfStock ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => handleToggleSelect(p.id)}
                              className="w-3.5 h-3.5 rounded text-sky-600 cursor-pointer"
                            />
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.primary_image}
                                alt={p.name}
                                className="w-11 h-11 object-cover rounded-xl bg-slate-100 border border-slate-200"
                              />
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                                  {p.name}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500 font-bold block mt-0.5">
                                  {p.sku}
                                </span>
                                {p.tags && p.tags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    {p.tags.slice(0, 3).map((t, idx) => (
                                      <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[9px]">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded block w-fit">
                              {p.category_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                              Age: {p.age_group || 'All Ages'}
                            </span>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span className="line-through text-slate-400 text-[10px] block">
                              ₹{p.mrp}
                            </span>
                            <span className="font-black text-slate-900 text-sm">
                              ₹{p.selling_price}
                            </span>
                          </td>

                          {/* Stock & Low-Stock Indicator */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-black text-[10px] ${
                              isOutOfStock ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              isLowStock ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isOutOfStock ? 'Out of Stock (0)' : isLowStock ? `⚠️ Low: ${p.stock_quantity} left` : `${p.stock_quantity} in stock`}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              Alert at ≤ {p.low_stock_threshold || 5}
                            </span>
                          </td>

                          {/* COD Quick Toggle */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleCod(p)}
                              title="Click to toggle Cash on Delivery availability for this product"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 mx-auto border cursor-pointer ${
                                p.is_cod_available === 1
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              <Banknote className="w-3 h-3" />
                              <span>{p.is_cod_available === 1 ? 'COD Yes' : 'No COD'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                                p.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800' :
                                p.status === 'archived' ? 'bg-slate-300 text-slate-700' :
                                'bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                            >
                              {p.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/product/${p.slug}`}
                                target="_blank"
                                className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition"
                                title="Preview on live store"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              <button
                                onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition"
                                title="Edit product details & images"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDuplicate(p.id)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                                title="Duplicate product"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {isArchived ? (
                                <button
                                  onClick={() => handleRestore(p.id, p.name)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                                  title="Restore product to active catalog"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(p.id, p.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                                  title="Archive Product (Soft Delete)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-bold">
                No products found matching your search and filter criteria.
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Price Adjustment Modal */}
          {showPriceModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="font-black text-slate-900 text-base">
                  Bulk Price Update ({selectedIds.length} Products)
                </h3>

                <form onSubmit={handleBulkPriceSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adjustment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPriceAdjustment({ ...priceAdjustment, type: 'percentage' })}
                        className={`py-2 rounded-xl font-bold border transition ${
                          priceAdjustment.type === 'percentage' ? 'bg-sky-500 text-slate-950 border-sky-600' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceAdjustment({ ...priceAdjustment, type: 'fixed' })}
                        className={`py-2 rounded-xl font-bold border transition ${
                          priceAdjustment.type === 'fixed' ? 'bg-sky-500 text-slate-950 border-sky-600' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        Fixed Amount (₹)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPriceAdjustment({ ...priceAdjustment, direction: 'increase' })}
                        className={`py-2 rounded-xl font-bold border flex items-center justify-center gap-1 transition ${
                          priceAdjustment.direction === 'increase' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Increase (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceAdjustment({ ...priceAdjustment, direction: 'decrease' })}
                        className={`py-2 rounded-xl font-bold border flex items-center justify-center gap-1 transition ${
                          priceAdjustment.direction === 'decrease' ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" /> Decrease (-)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {priceAdjustment.type === 'percentage' ? 'Percentage Value (%)' : 'Amount in Rupees (₹)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={priceAdjustment.value}
                      onChange={(e) => setPriceAdjustment({ ...priceAdjustment, value: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-black py-2.5 rounded-xl shadow-md transition"
                    >
                      Apply New Prices
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPriceModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
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
