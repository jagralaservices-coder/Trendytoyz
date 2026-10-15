import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Trash2, Edit3, Upload, X, CheckCircle2 } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminBanners() {
  const bannerFileInputRef = useRef(null);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    id: null,
    title: '',
    subtitle: '',
    image_url: '',
    button_text: 'Explore Collection',
    button_url: '/shop',
    display_order: 1,
    is_active: true
  });
  const [showModal, setShowModal] = useState(false);

  const handleBannerFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, image_url: res.url }));
      } else {
        alert(res.error || 'Failed to upload image.');
      }
    } catch (err) {
      alert(err.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoading(true);
    try {
      const res = await api.getAdminBanners();
      if (res.success) {
        setBanners(res.banners);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setForm({
      id: null,
      title: '',
      subtitle: '',
      image_url: '',
      button_text: 'Explore Collection',
      button_url: '/shop',
      display_order: banners.length + 1,
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setForm({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || '',
      image_url: b.image_url,
      button_text: b.button_text || 'Shop Now',
      button_url: b.button_url || '/shop',
      display_order: b.display_order || 1,
      is_active: b.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete banner "${title}"?`)) {
      try {
        await api.deleteBanner(id);
        loadBanners();
      } catch (err) {
        alert('Failed to delete banner.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.updateBanner(form.id, form);
      } else {
        await api.createBanner(form);
      }
      setShowModal(false);
      loadBanners();
    } catch (err) {
      alert(err.message || 'Error saving banner.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Homepage Banner Management" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Hero Sliders & Banners ({banners.length})</h3>
              <p className="text-xs text-slate-500">Manage promotional hero banners, CTA buttons and images</p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Add Homepage Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map(b => (
              <div key={b.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                <div className="h-44 rounded-2xl bg-slate-900 overflow-hidden relative">
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white bg-gradient-to-t from-slate-950/80 to-transparent">
                    <h4 className="font-black text-lg">{b.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-1">{b.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="font-bold text-slate-800">CTA: {b.button_text} ({b.button_url})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-slate-600 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.title)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Form */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {form.id ? 'Edit Banner' : 'Add New Homepage Banner'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Banner Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Discover Luxury & Elegance"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle</label>
                    <input
                      type="text"
                      placeholder="Shop Premium Toys & Genuine Leather Wallets"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image *</label>
                    <input
                      type="file"
                      ref={bannerFileInputRef}
                      accept="image/*"
                      onChange={handleBannerFileSelect}
                      className="hidden"
                    />

                    {form.image_url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group aspect-[21/9] max-h-48 flex items-center justify-center">
                        <img
                          src={form.image_url}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: '' })}
                            className="bg-rose-600 text-white p-1.5 rounded-xl text-xs hover:bg-rose-700 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-sky-50/20 transition text-slate-600"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {uploadingImage ? 'Uploading Image...' : 'Click to Upload Banner Image'}
                        </span>
                        <span className="text-[11px] text-slate-400">PNG, JPG, WebP supported</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Button Text</label>
                      <input
                        type="text"
                        value={form.button_text}
                        onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Button Link URL</label>
                      <input
                        type="text"
                        value={form.button_url}
                        onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-bold py-2.5 rounded-xl text-xs"
                    >
                      Save Banner
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
