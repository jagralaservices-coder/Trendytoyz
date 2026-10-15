import React, { useState, useEffect, useRef } from 'react';
import { Truck, Plus, Edit3, Trash2, Power, ExternalLink, Search, CheckCircle, AlertCircle, RefreshCw, Link2, Phone, Upload, X } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminShipping() {
  const courierLogoRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    logo: '',
    tracking_url_template: '',
    phone: '',
    is_active: true,
    display_order: 1
  });

  const handleCourierLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, logo: res.url }));
      } else {
        alert(res.error || 'Failed to upload logo.');
      }
    } catch (err) {
      alert(err.message || 'Error uploading logo.');
    } finally {
      setUploadingLogo(false);
      if (courierLogoRef.current) courierLogoRef.current.value = '';
    }
  };

  // Test URL state
  const [testAwb, setTestAwb] = useState('1234567890');

  useEffect(() => {
    loadCouriers();
  }, []);

  async function loadCouriers() {
    setLoading(true);
    try {
      const res = await api.getAdminCouriers();
      if (res.success) {
        setCouriers(res.couriers);
      }
    } catch (err) {
      console.error('Failed to load couriers:', err);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingCourier(null);
    setForm({
      name: '',
      code: '',
      logo: '',
      tracking_url_template: '',
      phone: '',
      is_active: true,
      display_order: couriers.length + 1
    });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingCourier(c);
    setForm({
      name: c.name || '',
      code: c.code || '',
      logo: c.logo || '',
      tracking_url_template: c.tracking_url_template || '',
      phone: c.phone || '',
      is_active: c.is_active === 1,
      display_order: c.display_order || 1
    });
    setShowModal(true);
  };

  const handleToggle = async (c) => {
    try {
      const res = await api.toggleCourierStatus(c.id);
      if (res.success) {
        setMsg({ type: 'success', text: `Courier "${c.name}" status updated to ${res.is_active === 1 ? 'Active' : 'Inactive'}.` });
        loadCouriers();
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update courier status.' });
    }
  };

  const handleDelete = async (c) => {
    if (window.confirm(`Are you sure you want to delete courier "${c.name}"?`)) {
      try {
        const res = await api.deleteCourier(c.id);
        if (res.success) {
          setMsg({ type: 'success', text: `Courier "${c.name}" deleted successfully.` });
          loadCouriers();
        }
      } catch (err) {
        setMsg({ type: 'error', text: 'Failed to delete courier partner.' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.tracking_url_template) {
      alert('Courier Name and Tracking URL Template are required.');
      return;
    }

    try {
      if (editingCourier) {
        await api.updateCourier(editingCourier.id, form);
        setMsg({ type: 'success', text: `Courier "${form.name}" updated successfully!` });
      } else {
        await api.createCourier(form);
        setMsg({ type: 'success', text: `Courier partner "${form.name}" created successfully!` });
      }
      setShowModal(false);
      loadCouriers();
    } catch (err) {
      alert(err.message || 'Failed to save courier.');
    }
  };

  const filteredCouriers = couriers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Shipping & Couriers Module" />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-navy-gradient text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black">Courier Partners & Tracking URLs</h1>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Pre-configured logistics partners operating around <strong>Versova / Andheri West, Mumbai</strong>.
                URLs support dynamic tracking with the <code>{'{TRACKING_NUMBER}'}</code> placeholder.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Courier Partner
            </button>
          </div>

          {/* Toast Notification */}
          {msg.text && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{msg.text}</span>
              </div>
              <button onClick={() => setMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
          )}

          {/* Search Bar & Test Tool */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search couriers by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <span className="text-slate-500 font-bold whitespace-nowrap">Test AWB:</span>
              <input
                type="text"
                value={testAwb}
                onChange={(e) => setTestAwb(e.target.value)}
                placeholder="e.g. 123456789"
                className="w-32 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
              <span className="text-[11px] text-slate-400 italic">Click "Test" on any partner below</span>
            </div>
          </div>

          {/* Couriers Grid */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-bold">Loading Courier Partners...</div>
          ) : filteredCouriers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCouriers.map((c) => {
                const sampleUrl = c.tracking_url_template.replace('{TRACKING_NUMBER}', testAwb || '123456789');

                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-2xl border p-5 space-y-3 shadow-xs transition ${
                      c.is_active === 1 ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {c.logo ? (
                          <div className="w-10 h-10 rounded-xl border border-slate-200 p-1 bg-white flex items-center justify-center overflow-hidden">
                            <img src={c.logo} alt={c.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            c.is_active === 1 ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{c.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">Code: {c.code || 'N/A'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggle(c)}
                        title={`Click to ${c.is_active === 1 ? 'Disable' : 'Activate'}`}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                          c.is_active === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {c.is_active === 1 ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Support Contact */}
                    {c.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Helpline: {c.phone}</span>
                      </p>
                    )}

                    {/* Tracking URL Template Box */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                        <span>URL TEMPLATE</span>
                        <span className="text-sky-600">{`{TRACKING_NUMBER}`}</span>
                      </div>
                      <p className="font-mono text-slate-800 break-all text-[10px] line-clamp-2">
                        {c.tracking_url_template}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <a
                        href={sampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 text-[11px]"
                        title="Test URL Template with Sample AWB"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Courier & URL"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete Courier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">
              No couriers found matching search.
            </div>
          )}

          {/* Add / Edit Courier Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-base">
                    {editingCourier ? `Edit Courier: ${editingCourier.name}` : 'Add New Courier Partner'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Courier Partner Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhivery, DTDC, Blue Dart"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Identifier Code</label>
                      <input
                        type="text"
                        placeholder="e.g. delhivery"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Support Helpline</label>
                      <input
                        type="text"
                        placeholder="e.g. 1800 233 1234"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Courier Partner Logo Upload */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Courier Logo Photo</label>
                    <input
                      type="file"
                      ref={courierLogoRef}
                      accept="image/*"
                      onChange={handleCourierLogoSelect}
                      className="hidden"
                    />

                    {form.logo ? (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <img
                          src={form.logo}
                          alt="Courier Logo"
                          className="w-12 h-10 object-contain bg-white rounded-lg p-1 border border-slate-200"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => courierLogoRef.current?.click()}
                            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs"
                          >
                            Change Logo
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, logo: '' })}
                            className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => courierLogoRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-3 flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-sky-50/20 text-slate-600 transition"
                      >
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span className="font-bold text-xs">
                          {uploadingLogo ? 'Uploading...' : 'Click to Upload Courier Logo'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700 block">
                        Live Tracking URL Template *
                      </label>
                      <span className="text-[10px] text-sky-600 font-bold">
                        Must contain {'{TRACKING_NUMBER}'}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="https://track.courier.com/tracking?awb={TRACKING_NUMBER}"
                      value={form.tracking_url_template}
                      onChange={(e) => setForm({ ...form, tracking_url_template: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      The placeholder <code>{'{TRACKING_NUMBER}'}</code> will be auto-replaced by the customer's actual AWB.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span className="font-bold text-slate-700">Active / Enabled for Dispatch Dropdown</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 bg-navy-gradient text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md transition"
                    >
                      {editingCourier ? 'Save Changes' : 'Create Courier'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
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
