import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Banknote,
  CheckCircle, AlertCircle, Upload, ArrowUp, ArrowDown, Star,
  RefreshCw, Check, X, ShieldAlert, Sparkles, Truck
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

// Utility to compress and resize an image file using an HTML5 Canvas
async function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    // If not an image or is SVG, don't re-compress
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    subcategory: '',
    brand: 'TRENDYTOYZ',
    age_group: '3-8 Years',
    tags_text: '',
    description: '',
    short_description: '',
    key_features_text: '',
    mrp: '',
    selling_price: '',
    purchase_cost: '',
    gst_percent: '18',
    stock_quantity: '50',
    low_stock_threshold: '5',
    weight: '0.5',
    dimensions: '',
    is_free_shipping: false,
    shipping_charge: '49',
    is_cod_available: true,
    is_online_available: true,
    amazon_url: '',
    flipkart_url: '',
    meesho_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: false,
    status: 'active',
    images: []
  });

  // URL input helper
  const [manualUrlInput, setManualUrlInput] = useState('');

  useEffect(() => {
    api.getAdminCategories().then(res => {
      if (res.success && res.categories.length > 0) {
        setCategories(res.categories);
        if (!isEdit) {
          setForm(f => ({ ...f, category_id: res.categories[0].id }));
        }
      }
    }).catch(console.error);

    if (isEdit) {
      setLoading(true);
      api.getProductBySlug(id).then(res => {
        if (res.success && res.product) {
          const p = res.product;
          setForm({
            name: p.name || '',
            sku: p.sku || '',
            category_id: p.category_id || '',
            subcategory: p.subcategory || '',
            brand: p.brand || 'TRENDYTOYZ',
            age_group: p.age_group || 'All Ages',
            tags_text: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
            description: p.description || '',
            short_description: p.short_description || '',
            key_features_text: Array.isArray(p.key_features) ? p.key_features.join('\n') : (p.key_features || ''),
            mrp: p.mrp || '',
            selling_price: p.selling_price || '',
            purchase_cost: p.purchase_cost || '',
            gst_percent: p.gst_percent || '18',
            stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 0,
            low_stock_threshold: p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5,
            weight: p.weight || '0.5',
            dimensions: p.dimensions || '',
            is_free_shipping: p.is_free_shipping === true || p.is_free_shipping === 1,
            shipping_charge: p.shipping_charge !== undefined ? String(p.shipping_charge) : '49',
            is_cod_available: p.is_cod_available === 1,
            is_online_available: p.is_online_available === 1,
            amazon_url: p.amazon_url || '',
            flipkart_url: p.flipkart_url || '',
            meesho_url: p.meesho_url || '',
            seo_title: p.seo_title || '',
            seo_description: p.seo_description || '',
            seo_keywords: p.seo_keywords || '',
            is_featured: p.is_featured === 1,
            is_best_seller: p.is_best_seller === 1,
            is_new_arrival: p.is_new_arrival === 1,
            status: p.status || 'active',
            images: Array.isArray(p.images) ? p.images.filter(Boolean) : []
          });
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // --- IMAGE MANAGEMENT ---

  // Upload and compress multiple images
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Compress each file in parallel
      const compressedFiles = await Promise.all(
        files.map(f => compressImageFile(f, 1200, 1200, 0.85))
      );

      const formData = new FormData();
      compressedFiles.forEach(f => formData.append('images', f));

      const res = await api.uploadImages(formData);
      if (res.success && res.urls) {
        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...res.urls]
        }));
        setSuccessMsg(`${res.urls.length} image(s) compressed and uploaded successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace a specific image
  const handleReplaceImage = async (index, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.85);
      const formData = new FormData();
      formData.append('images', compressed);
      const res = await api.uploadImages(formData);
      if (res.success && res.urls && res.urls[0]) {
        const updated = [...form.images];
        updated[index] = res.urls[0];
        setForm({ ...form, images: updated });
      }
    } catch (err) {
      alert('Failed to replace image.');
    } finally {
      setUploading(false);
    }
  };

  // Reorder: Move up
  const handleMoveImageUp = (index) => {
    if (index === 0) return;
    const updated = [...form.images];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setForm({ ...form, images: updated });
  };

  // Reorder: Move down
  const handleMoveImageDown = (index) => {
    if (index === form.images.length - 1) return;
    const updated = [...form.images];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setForm({ ...form, images: updated });
  };

  // Set as Main / Primary Image (move to index 0)
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const target = form.images[index];
    const remaining = form.images.filter((_, idx) => idx !== index);
    setForm({ ...form, images: [target, ...remaining] });
  };

  // Delete image
  const handleDeleteImage = (index) => {
    const updated = form.images.filter((_, idx) => idx !== index);
    setForm({ ...form, images: updated });
  };

  // Add URL manually
  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    setForm({ ...form, images: [...form.images, manualUrlInput.trim()] });
    setManualUrlInput('');
  };

  // --- SUBMIT VALIDATION & SAVE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!form.category_id) {
      setError('Please select a Product Category.');
      return;
    }
    if (!form.mrp || parseFloat(form.mrp) <= 0) {
      setError('Please enter a valid MRP greater than 0.');
      return;
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      setError('Please enter a valid Selling Price greater than 0.');
      return;
    }
    if (parseFloat(form.selling_price) > parseFloat(form.mrp)) {
      setError('Selling Price cannot be higher than MRP.');
      return;
    }
    if (form.stock_quantity === '' || parseInt(form.stock_quantity) < 0) {
      setError('Stock quantity cannot be negative.');
      return;
    }
    if (form.images.length === 0) {
      setError('Please upload at least one product image.');
      return;
    }

    const payload = {
      ...form,
      mrp: parseFloat(form.mrp),
      selling_price: parseFloat(form.selling_price),
      purchase_cost: parseFloat(form.purchase_cost || 0),
      stock_quantity: parseInt(form.stock_quantity || 0),
      low_stock_threshold: parseInt(form.low_stock_threshold || 5),
      weight: parseFloat(form.weight || 0.5),
      is_free_shipping: form.is_free_shipping,
      shipping_charge: form.is_free_shipping ? 0 : parseFloat(form.shipping_charge || 0),
      key_features: form.key_features_text.split('\n').filter(line => line.trim().length > 0),
      tags: form.tags_text.split(',').map(t => t.trim()).filter(Boolean),
      images: form.images.filter(Boolean)
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.updateProduct(id, payload);
      } else {
        await api.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const parsedTagBadges = form.tags_text.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={isEdit ? `Edit Product: ${form.name || ''}` : 'Add New Product'} />

        <main className="p-4 sm:p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Top Bar Navigation & Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="text-slate-600 font-bold text-xs flex items-center gap-1 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Products
              </button>

              <button
                type="submit"
                disabled={loading || uploading}
                className="bg-navy-gradient hover:bg-slate-800 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Basic Details */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">
                Basic Product Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Product Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Remote Control High Speed Monster Truck"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    placeholder="e.g. TOY-RC-001 (Auto-generated if empty)"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subcategory / Type</label>
                  <input
                    type="text"
                    placeholder="e.g. RC Toys, STEM Educational, Bifold Wallets"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Age Group</label>
                  <select
                    value={form.age_group}
                    onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="0-2 Years">0-2 Years (Toddlers)</option>
                    <option value="3-5 Years">3-5 Years (Preschool)</option>
                    <option value="6-8 Years">6-8 Years (Early School)</option>
                    <option value="9-12 Years">9-12 Years (Pre-Teen)</option>
                    <option value="12+ Years">12+ Years (Teens & Collectors)</option>
                    <option value="All Ages">All Ages</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catalog Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="active">Active (Visible on Store)</option>
                    <option value="disabled">Disabled / Inactive (Hidden)</option>
                    <option value="archived">Archived (Soft Deleted)</option>
                  </select>
                </div>
              </div>

              {/* Tags input */}
              <div className="text-xs space-y-1 pt-1">
                <label className="font-bold text-slate-700 block">
                  Product Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rc car, remote control, gift, monster truck"
                  value={form.tags_text}
                  onChange={(e) => setForm({ ...form, tags_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
                {parsedTagBadges.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {parsedTagBadges.map((t, idx) => (
                      <span key={idx} className="bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-sky-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Description (Summary Highlight)</label>
                  <input
                    type="text"
                    placeholder="Brief 1-2 sentence highlight for catalog cards..."
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    placeholder="Comprehensive product details, materials, specs, instructions..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Key Features (One per line)</label>
                  <textarea
                    rows={4}
                    placeholder="2.4GHz Anti-Interference Transmitter&#10;Shock Absorbers for All-Terrain Racing&#10;Rechargeable Battery Included"
                    value={form.key_features_text}
                    onChange={(e) => setForm({ ...form, key_features_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* 2. IMAGE MANAGEMENT SECTION (COMPRESSION, REORDER, PRIMARY) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span>Product Image Gallery ({form.images.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload images from your device. Images are auto-compressed and optimized on upload.
                  </p>
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Compressing & Uploading...' : 'Upload Photos'}</span>
                  </label>
                </div>
              </div>

              {/* Image Grid with Previews, Reorder, Replace, Delete */}
              {form.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {form.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative bg-slate-50 rounded-2xl border p-2 space-y-2 group transition ${
                        idx === 0 ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-slate-100">
                        <img
                          src={imgUrl}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Primary Badge */}
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-sky-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Main Image
                          </div>
                        )}
                      </div>

                      {/* Controls Bar for this image */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        {/* Move Up / Down (Reorder) */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImageUp(idx)}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded"
                            title="Move Earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.images.length - 1}
                            onClick={() => handleMoveImageDown(idx)}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded"
                            title="Move Later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Set Primary Button */}
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="text-[10px] font-bold text-sky-600 hover:text-sky-800"
                            title="Make this the cover/primary photo"
                          >
                            Make Main
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="font-extrabold text-slate-700 text-xs">No images uploaded yet</p>
                  <p className="text-[11px] text-slate-400">
                    Click "Upload Photos" above to select and upload product images.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Pricing & Inventory (with Low-stock Threshold) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">
                Pricing & Stock Threshold
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (Original Price ₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2499"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling / Offer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1299"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-sky-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price / Purchase (₹)</label>
                  <input
                    type="number"
                    placeholder="600"
                    value={form.purchase_cost}
                    onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity Available *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Low-Stock Alert Threshold *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Alert triggers when stock drops to or below this number.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={form.gst_percent}
                    onChange={(e) => setForm({ ...form, gst_percent: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 4. Cash on Delivery (COD) Availability Card */}
            <div className={`rounded-3xl border p-6 space-y-4 shadow-xs transition ${
              form.is_cod_available ? 'bg-emerald-50/40 border-emerald-300' : 'bg-amber-50/40 border-amber-300'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    form.is_cod_available ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Cash on Delivery (COD) Availability
                    </h3>
                    <p className="text-xs text-slate-500">
                      Toggle whether customers can purchase this item via Cash on Delivery
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  form.is_cod_available ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {form.is_cod_available ? 'COD Available' : 'Prepaid Only'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div
                  onClick={() => setForm({ ...form, is_cod_available: false })}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition bg-white ${
                    !form.is_cod_available ? 'border-amber-600 ring-2 ring-amber-300/30' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="radio"
                      name="cod_opt"
                      checked={!form.is_cod_available}
                      onChange={() => setForm({ ...form, is_cod_available: false })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span>COD Not Available (Prepaid Online Only)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    Customer must pay via UPI / Cards / NetBanking.
                  </p>
                </div>

                <div
                  onClick={() => setForm({ ...form, is_cod_available: true })}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition bg-white ${
                    form.is_cod_available ? 'border-emerald-600 ring-2 ring-emerald-300/30' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="radio"
                      name="cod_opt"
                      checked={form.is_cod_available}
                      onChange={() => setForm({ ...form, is_cod_available: true })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span>COD Available</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    Customer can pay in cash upon doorstep delivery (+₹50 COD charge).
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Shipping & Delivery Charges Option (Free Shipping vs Custom Shipping Charges) */}
            <div className={`rounded-3xl border p-6 space-y-4 shadow-xs transition ${
              form.is_free_shipping ? 'bg-emerald-50/40 border-emerald-300' : 'bg-sky-50/40 border-sky-300'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    form.is_free_shipping ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Shipping & Delivery Charges
                    </h3>
                    <p className="text-xs text-slate-500">
                      Product upload ke time choose karein: Free Shipping ya Custom Shipping Charges
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  form.is_free_shipping ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-900'
                }`}>
                  {form.is_free_shipping ? 'Free Shipping (₹0)' : `Shipping: ₹${form.shipping_charge || 0}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Option 1: Free Shipping */}
                <div
                  onClick={() => setForm({ ...form, is_free_shipping: true, shipping_charge: '0' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition bg-white ${
                    form.is_free_shipping ? 'border-emerald-600 ring-2 ring-emerald-300/30 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="radio"
                      name="shipping_opt"
                      checked={form.is_free_shipping}
                      onChange={() => setForm({ ...form, is_free_shipping: true, shipping_charge: '0' })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-emerald-700 font-black">Free Shipping (₹0 Delivery)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6 leading-relaxed">
                    Customer ko koi delivery charges nahi lagenge. Live product page, card aur cart me "FREE Delivery" badge highlight hoga.
                  </p>
                </div>

                {/* Option 2: Custom Shipping Charges */}
                <div
                  onClick={() => setForm({ ...form, is_free_shipping: false, shipping_charge: form.shipping_charge === '0' ? '49' : form.shipping_charge })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition bg-white ${
                    !form.is_free_shipping ? 'border-sky-600 ring-2 ring-sky-300/30 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="radio"
                      name="shipping_opt"
                      checked={!form.is_free_shipping}
                      onChange={() => setForm({ ...form, is_free_shipping: false, shipping_charge: form.shipping_charge === '0' ? '49' : form.shipping_charge })}
                      className="w-4 h-4 text-sky-600"
                    />
                    <span className="text-sky-700 font-black">Shipping Charges (Custom Delivery Fee)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6 leading-relaxed">
                    Is product par customer se custom shipping fee collect ki jayegi. Niche delivery charge set karein.
                  </p>

                  {!form.is_free_shipping && (
                    <div className="mt-3 pl-6" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Shipping Charge Amount (₹) *
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700 text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 49"
                          value={form.shipping_charge}
                          onChange={(e) => setForm({ ...form, shipping_charge: e.target.value })}
                          className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-[11px] text-slate-400">(Default: ₹49 standard courier)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Badges & Marketplace Links */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">
                Promotional Badges & Marketplace URLs
              </h3>

              <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_best_seller}
                    onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_new_arrival}
                    onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Amazon Link</label>
                  <input
                    type="url"
                    placeholder="https://amazon.in/dp/..."
                    value={form.amazon_url}
                    onChange={(e) => setForm({ ...form, amazon_url: e.target.value })}
                    className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-blue-900 block mb-1">Flipkart Link</label>
                  <input
                    type="url"
                    placeholder="https://flipkart.com/item/..."
                    value={form.flipkart_url}
                    onChange={(e) => setForm({ ...form, flipkart_url: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50/40 border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-pink-900 block mb-1">Meesho Link</label>
                  <input
                    type="url"
                    placeholder="https://meesho.com/..."
                    value={form.meesho_url}
                    onChange={(e) => setForm({ ...form, meesho_url: e.target.value })}
                    className="w-full px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || uploading}
                className="bg-navy-gradient hover:bg-slate-800 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl transition text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {loading ? 'Saving Product...' : 'Save Product'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
