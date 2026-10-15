import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, FolderTree, Upload, X, RotateCcw, Archive } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api, apiRequest } from '../../services/api';

export default function AdminCategories() {
  const categoryFileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({ id: null, name: '', description: '', image: '', display_order: 0, is_active: true });
  const [showModal, setShowModal] = useState(false);

  const handleCategoryFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, image: res.url }));
      } else {
        alert(res.error || 'Failed to upload image.');
      }
    } catch (err) {
      alert(err.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
      if (categoryFileInputRef.current) categoryFileInputRef.current.value = '';
    }
  };

  const [includeDeleted, setIncludeDeleted] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [includeDeleted]);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await apiRequest(`/categories/admin?includeDeleted=${includeDeleted}`);
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setForm({ id: null, name: '', description: '', image: '', display_order: categories.length + 1, is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setForm({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      display_order: cat.display_order || 0,
      is_active: cat.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ Archive category "${name}"?\n\nThis will safely soft-delete this category and archive its products.\n• Real order records and sales history will NEVER be deleted.\n• You can restore this category anytime.`)) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (err) {
        alert('Failed to delete category: ' + (err.message || 'Server error'));
      }
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await api.restoreCategory(id);
      loadCategories();
    } catch (err) {
      alert('Failed to restore category: ' + (err.message || 'Server error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.updateCategory(form.id, form);
      } else {
        await api.createCategory(form);
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Error saving category.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Category Management" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Product Categories ({categories.length})</h3>
              <p className="text-xs text-slate-500">Manage Toys, Wallets and catalog categories</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Show Archived</span>
              </label>

              <button
                onClick={handleOpenAdd}
                className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Products</th>
                  <th className="p-3.5 text-center">Order</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <tr key={cat.id} className={`hover:bg-slate-50 ${cat.is_deleted ? 'bg-amber-50/40 opacity-75' : ''}`}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img src={cat.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=200&q=80'} alt={cat.name} className="w-9 h-9 object-cover rounded-xl bg-slate-100" />
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{cat.name}</span>
                          {cat.description && <span className="text-[10px] text-slate-500 max-w-xs truncate block">{cat.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{cat.slug}</td>
                    <td className="p-3.5">
                      {cat.is_deleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-sky-600">{cat.product_count || 0}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">{cat.display_order}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cat.is_deleted ? (
                          <button
                            onClick={() => handleRestore(cat.id, cat.name)}
                            title="Restore Category"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-1 font-bold text-[11px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                              title="Edit Category"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              title="Archive (Soft Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Form */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {form.id ? 'Edit Category' : 'Add New Category'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Watches"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category Cover Image</label>
                    <input
                      type="file"
                      ref={categoryFileInputRef}
                      accept="image/*"
                      onChange={handleCategoryFileSelect}
                      className="hidden"
                    />

                    {form.image ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group aspect-[16/9] max-h-40 flex items-center justify-center">
                        <img
                          src={form.image}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => categoryFileInputRef.current?.click()}
                            className="bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image: '' })}
                            className="bg-rose-600 text-white p-1.5 rounded-xl text-xs hover:bg-rose-700 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => categoryFileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-sky-50/20 transition text-slate-600"
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {uploadingImage ? 'Uploading Image...' : 'Click to Upload Category Image'}
                        </span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, WebP supported</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md"
                    >
                      Save Category
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
