import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Save, 
  CreditCard, 
  Banknote, 
  Truck, 
  ShieldAlert, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  Mail,
  Send,
  Check,
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  HardDrive
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminSettings() {
  const logoFileInputRef = useRef(null);
  const backupFileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [settings, setSettings] = useState({
    // Business Details (Seller FROM on Shipping Label & Invoice)
    business_name: 'TRENDYTOYZ Retail Private Limited',
    brand_name: 'TRENDYTOYZ',
    brand_logo: '',
    brand_tagline: 'Premium Toys & Play Essentials',
    business_address: 'Versova, Yari Road, Near D Mart, Andheri West',
    business_city: 'Mumbai',
    business_state: 'Maharashtra',
    business_pincode: '400061',
    business_phone: '+91 7718862274',
    business_email: 'trendytoys.info@gmail.com',
    instagram_id: 'jgrl_co',
    gstin: '27DHHPJ9326M1ZQ',

    // Cancellation & No-Return Policy
    cancellation_policy: 'Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.',
    damaged_item_reporting_enabled: 'true',
    damaged_item_window_hours: '48',

    // Inventory & Alert Settings
    low_stock_default_threshold: '5',

    // Payment Gateway
    payment_gateway_provider: 'razorpay',
    razorpay_key_id: 'rzp_test_placeholder_key',
    razorpay_key_secret: 'rzp_test_placeholder_secret',
    online_payments_enabled: 'true',

    // COD & Shipping
    cod_enabled: 'true',
    cod_charge: '50',
    cod_min_order: '299',
    cod_max_order: '10000',
    standard_shipping_charge: '49',
    free_shipping_threshold: '799',

    // Email Notifications & SMTP (Google / Custom SMTP)
    admin_notification_email: 'trendytoys.info@gmail.com',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: 'trendytoys.info@gmail.com',
    smtp_pass: '',
    email_order_confirmation_enabled: 'true',
    email_admin_alert_enabled: 'true',
    site_url: 'https://trendytoyz.com'
  });

  const [testingEmail, setTestingEmail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await api.getAdminSettings();
      if (res.success && res.settings) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      if (res.success && res.url) {
        setSettings(prev => ({ ...prev, brand_logo: res.url }));
      } else {
        alert(res.error || 'Failed to upload logo.');
      }
    } catch (err) {
      alert(err.message || 'Error uploading logo.');
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.updateAdminSettings(settings);
      if (res.success) {
        setMsg({ type: 'success', text: 'All settings updated successfully! Changes reflect immediately on shipping labels and checkout.' });
        setTimeout(() => setMsg({ type: '', text: '' }), 5000);
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

    const tabs = [
    { id: 'business', label: 'Business & Seller (FROM) Details', icon: Building2 },
    { id: 'policy', label: 'Cancellation & Return Rules', icon: ShieldAlert },
    { id: 'shipping', label: 'Shipping & COD Rules', icon: Truck },
    { id: 'payment', label: 'Online Payment Gateway', icon: CreditCard },
    { id: 'email', label: 'Email & Notifications (SMTP)', icon: Mail },
    { id: 'alerts', label: 'Inventory Alerts', icon: Sliders },
    { id: 'backup', label: 'Database Backup & Data Safety', icon: Database }
  ];

  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackups();
    }
  }, [activeTab]);

  async function loadBackups() {
    setLoadingBackups(true);
    try {
      const res = await api.getBackupsList();
      if (res.success) {
        setBackups(res.backups || []);
      }
    } catch (e) {
      console.error('Failed to load backup list:', e);
    } finally {
      setLoadingBackups(false);
    }
  }

  const handleExportJSON = async () => {
    try {
      const token = localStorage.getItem('jgrl_token') || '';
      const response = await fetch('/api/backup/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate export backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trendytoyz-database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMsg({ type: 'success', text: 'Full database JSON backup downloaded successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Export failed.' });
    }
  };

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const res = await api.createBackupSnapshot('manual_admin');
      if (res.success) {
        setMsg({ type: 'success', text: 'Database snapshot created successfully on disk!' });
        loadBackups();
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to create snapshot.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error creating snapshot.' });
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleFileRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`⚠️ RESTORE DATABASE FROM BACKUP FILE?\n\nFile: ${file.name}\n\n• Existing healthy products, categories and orders will NOT be deleted.\n• Missing or updated records will be safely restored.\n\nAre you sure you want to proceed?`)) {
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
      return;
    }

    setRestoringBackup(true);
    try {
      const fileText = await file.text();
      const backupJSON = JSON.parse(fileText);

      const res = await api.importBackup(backupJSON);
      if (res.success) {
        setMsg({
          type: 'success',
          text: `Backup Restored! Products: ${res.results?.productsRestored || 0}, Categories: ${res.results?.categoriesRestored || 0}, Orders: ${res.results?.ordersRestored || 0}`
        });
        loadSettings();
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to restore backup.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Invalid backup file: ' + err.message });
    } finally {
      setRestoringBackup(false);
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.testEmailSettings({ testEmail: settings.admin_notification_email });
      if (res.success) {
        setMsg({
          type: 'success',
          text: res.message || `Test email dispatched to ${settings.admin_notification_email}!`
        });
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to send test email.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error sending test email.' });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Store Settings & Configuration" />

        <main className="p-4 sm:p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900">TRENDYTOYZ System Settings</h2>
                <p className="text-xs text-slate-500">Configure seller dispatch address, cancellation policy, database safety, and shipping.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                  title="Export full system backup (Products, Categories, Orders, Settings)"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Backup</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
                </button>
              </div>
            </div>

            {msg.text && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                msg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs ${
                      isActive 
                        ? 'bg-slate-900 text-white ring-2 ring-slate-900' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Business Details & Seller Address */}
            {activeTab === 'business' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>Seller "FROM" Address (Printed on Shipping Labels & Invoices)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This exact address will appear in the FROM box on 4x6 / A4 shipping labels when packing orders near Versova/Andheri West.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Business / Legal Entity Name *</label>
                    <input
                      type="text"
                      required
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name</label>
                    <input
                      type="text"
                      required
                      value={settings.brand_name}
                      onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  {/* Brand / Store Logo Upload */}
                  <div className="sm:col-span-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Store & Brand Logo (For Invoices, Labels & Header)
                    </label>
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/*"
                      onChange={handleLogoFileSelect}
                      className="hidden"
                    />

                    {settings.brand_logo ? (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-16 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={settings.brand_logo}
                            alt="Brand Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Logo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, brand_logo: '' })}
                            className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-100 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-4 flex items-center justify-center gap-2.5 bg-white hover:bg-sky-50/20 transition text-slate-600"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {uploadingLogo ? 'Uploading Logo...' : 'Click to Upload Store Logo Photo'}
                        </span>
                        <span className="text-[11px] text-slate-400">PNG, JPG, WebP supported</span>
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Street Address (Shop / Warehouse / Unit) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={settings.business_address}
                      onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                      placeholder="e.g. Versova, Yari Road, Near D Mart, Andheri West"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={settings.business_city}
                      onChange={(e) => setSettings({ ...settings, business_city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Mumbai"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={settings.business_state}
                      onChange={(e) => setSettings({ ...settings, business_state: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Maharashtra"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={settings.business_pincode}
                      onChange={(e) => setSettings({ ...settings, business_pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      placeholder="e.g. 400061"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={settings.business_phone}
                      onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      placeholder="e.g. +91 7718862274"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Support / Dispatch Email *</label>
                    <input
                      type="email"
                      required
                      value={settings.business_email}
                      onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      placeholder="e.g. trendytoys.info@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Instagram Username / Handle</label>
                    <input
                      type="text"
                      value={settings.instagram_id || ''}
                      onChange={(e) => setSettings({ ...settings, instagram_id: e.target.value.replace('@', '') })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-pink-700"
                      placeholder="e.g. jgrl_co"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase"
                      placeholder="e.g. 27DHHPJ9326M1ZQ"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Cancellation & No-Return Policy */}
            {activeTab === 'policy' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Cancellation & No-Return Policy Rules</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enforced strictly across product pages, cart, checkout, confirmation, invoices, and customer dashboard.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Official Policy Text (Shown to customers)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={settings.cancellation_policy}
                      onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          Damaged / Wrong Item Received Exception
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Allow customers to report damaged or wrong toys within a set reporting window with unboxing proof.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.damaged_item_reporting_enabled === 'true'}
                          onChange={(e) => setSettings({
                            ...settings,
                            damaged_item_reporting_enabled: e.target.checked ? 'true' : 'false'
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {settings.damaged_item_reporting_enabled === 'true' && (
                      <div className="pt-2 border-t border-amber-200/60 flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                          Reporting Window (Hours):
                        </label>
                        <input
                          type="number"
                          min="12"
                          max="168"
                          value={settings.damaged_item_window_hours}
                          onChange={(e) => setSettings({ ...settings, damaged_item_window_hours: e.target.value })}
                          className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">Default: 48 hours</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Shipping & COD Rules */}
            {activeTab === 'shipping' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>Shipping Charges & Cash on Delivery (COD) Rules</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Control standard delivery fees, free delivery limits, and COD eligibility.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Standard Shipping Fee (₹)</label>
                    <input
                      type="number"
                      value={settings.standard_shipping_charge}
                      onChange={(e) => setSettings({ ...settings, standard_shipping_charge: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Free Shipping Order Min (₹)</label>
                    <input
                      type="number"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">COD Handling Fee (₹)</label>
                    <input
                      type="number"
                      value={settings.cod_charge}
                      onChange={(e) => setSettings({ ...settings, cod_charge: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">COD Min Order (₹)</label>
                    <input
                      type="number"
                      value={settings.cod_min_order}
                      onChange={(e) => setSettings({ ...settings, cod_min_order: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">COD Max Order (₹)</label>
                    <input
                      type="number"
                      value={settings.cod_max_order}
                      onChange={(e) => setSettings({ ...settings, cod_max_order: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Online Payment Gateway */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span>Payment Gateway Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Configure UPI, Credit/Debit cards, and NetBanking gateways.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Active Gateway Provider</label>
                    <select
                      value={settings.payment_gateway_provider}
                      onChange={(e) => setSettings({ ...settings, payment_gateway_provider: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="razorpay">Razorpay (Recommended for India UPI/Cards)</option>
                      <option value="phonepe">PhonePe Payment Gateway</option>
                      <option value="cashfree">Cashfree Payments</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      placeholder="rzp_live_xxxxxxxx"
                      value={settings.razorpay_key_id}
                      onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Razorpay Key Secret (Encrypted on Server)</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={settings.razorpay_key_secret}
                      onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Inventory & Low Stock Alerts */}
            {activeTab === 'alerts' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span>Inventory Low-Stock Thresholds</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set the global inventory threshold. Products with stock at or below this value will trigger visual warning badges in the Admin Product catalog.
                  </p>
                </div>

                <div className="max-w-xs">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Default Low Stock Alert Threshold (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={settings.low_stock_default_threshold}
                    onChange={(e) => setSettings({ ...settings, low_stock_default_threshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-amber-700"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">Can also be overridden per product.</span>
                </div>
              </div>
            )}

            {/* TAB 6: Email & Notifications (SMTP) */}
            {activeTab === 'email' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>Automated Email Notifications & SMTP Configuration</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    When customers place an order, automatically send an Order Confirmation email with invoice details & live tracking link to the customer, and a real-time New Order Received alert to you.
                  </p>
                </div>

                {/* Information Card */}
                <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 text-xs space-y-2 text-sky-950">
                  <div className="font-bold flex items-center gap-2 text-sky-900">
                    <Check className="w-4 h-4 text-sky-600" />
                    <span>How Automated Order Emails Work:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sky-800 text-[11px]">
                    <li><strong>To Customer:</strong> Branded email confirming their order with itemized toy list, price breakdown, cancellation policy, and 1-click live shipment tracking link.</li>
                    <li><strong>To Store Owner:</strong> Instant notification containing customer name, phone number (with 1-click WhatsApp link), full delivery address, toy list to pack, and direct [Accept Order] button.</li>
                    <li><strong>Gmail SMTP Setup:</strong> To send via Gmail, use your Gmail address and generate a 16-character <em>App Password</em> from Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Store Owner Alert Email */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Store Owner / Admin Alert Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. trendytoys.info@gmail.com"
                      value={settings.admin_notification_email}
                      onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <span className="text-[11px] text-slate-500 block mt-1">
                      You will receive new order alerts with customer details and packing lists at this address.
                    </span>
                  </div>

                  {/* SMTP Host */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">Default for Gmail: smtp.gmail.com</span>
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Port</label>
                    <input
                      type="number"
                      placeholder="587"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">587 for TLS (or 465 for SSL)</span>
                  </div>

                  {/* SMTP User / Email */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Username / Sender Email</label>
                    <input
                      type="email"
                      placeholder="trendytoys.info@gmail.com"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">Gmail or custom domain email address</span>
                  </div>

                  {/* SMTP Password / App Password */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Password / App Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={settings.smtp_pass}
                      onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">16-character Google App Password</span>
                  </div>

                  {/* Store Live Base URL */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Store Base URL (For Tracking Links in Emails)</label>
                    <input
                      type="url"
                      placeholder="https://jgrl.co"
                      value={settings.site_url}
                      onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Email Test Button */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Test SMTP Configuration</span>
                    <span className="text-[11px] text-slate-500">
                      Send a test email to <strong>{settings.admin_notification_email || 'your email'}</strong> to verify settings before going live.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="px-5 py-2.5 bg-sky-50 border border-sky-300 hover:bg-sky-100 text-sky-800 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingEmail ? 'Sending Test Email...' : 'Send Test Email'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Database Backup & Data Safety */}
            {activeTab === 'backup' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Database Backup & Anti-Data-Loss Center</h3>
                  <p className="text-xs text-slate-500">
                    Your products, categories, orders, customers, and settings are stored in persistent disk storage. Export, restore, or download physical database snapshots here.
                  </p>
                </div>

                {/* Storage & Persistence Health Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Permanent Disk Persistence Active & Protected</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-semibold pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Database Storage</span>
                      <span className="text-slate-900 font-mono font-bold">./data/database.sqlite</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Media / Uploads</span>
                      <span className="text-slate-900 font-mono font-bold">./data/uploads/</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Automated Backups</span>
                      <span className="text-emerald-700 font-bold">Active (Daily, Retains 7)</span>
                    </div>
                  </div>
                </div>

                {/* Export & Import Actions Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Export Full System Backup */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Export System Backup (JSON)</h4>
                        <p className="text-[11px] text-slate-500">Download all products, categories, orders, customers & settings.</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Creates a portable JSON file containing your entire catalog and order records. Safe to keep on your computer or cloud drive.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON Backup</span>
                    </button>
                  </div>

                  {/* Import / Restore Backup */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Import / Restore Backup (JSON)</h4>
                        <p className="text-[11px] text-slate-500">Safely restore or upsert missing products, categories & settings.</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload a previously exported JSON backup file. Healthy existing data is preserved without destructive overwrites.
                    </p>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileRestore}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={restoringBackup}
                      onClick={() => backupFileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{restoringBackup ? 'Restoring Backup...' : 'Select Backup File to Restore'}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Database Snapshot Section */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Disk Database Snapshots (Keep Last 7)</h4>
                      <p className="text-[11px] text-slate-500">Physical SQLite point-in-time backups saved on server storage.</p>
                    </div>

                    <button
                      type="button"
                      disabled={creatingSnapshot}
                      onClick={handleCreateSnapshot}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{creatingSnapshot ? 'Creating Snapshot...' : 'Create Snapshot Now'}</span>
                    </button>
                  </div>

                  {/* Backups Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Snapshot File</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Created</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingBackups ? (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">Loading available snapshots...</td>
                          </tr>
                        ) : backups.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">No snapshots found yet. Click "Create Snapshot Now" or wait for daily schedule.</td>
                          </tr>
                        ) : (
                          backups.map((b, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-900 text-[11px]">
                                {b.fileName}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  b.isAutomatic ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {b.isAutomatic ? 'Automated Daily' : 'Manual'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 font-mono text-[11px]">{b.sizeKB} KB</td>
                              <td className="p-3 text-slate-500 text-[11px]">
                                {new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="p-3 text-right">
                                <a
                                  href={`/api/backup/download-file/${b.fileName}`}
                                  download
                                  className="px-2.5 py-1 text-sky-600 hover:text-sky-800 font-extrabold hover:bg-sky-50 rounded-lg inline-flex items-center gap-1 text-[11px]"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-8 py-3 rounded-2xl shadow-xl transition text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
