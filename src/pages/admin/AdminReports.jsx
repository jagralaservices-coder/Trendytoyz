import React, { useState } from 'react';
import { Download, BarChart3, FileSpreadsheet } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { api } from '../../services/api';

export default function AdminReports() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async (type) => {
    setDownloading(true);
    try {
      const res = await api.getReportCsv(type);
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', res.filename || `${type}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Failed to generate report CSV.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Analytical Store Reports" />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-sm">Downloadable CSV Reports</h3>
            <p className="text-xs text-slate-500">Export complete transactional datasets for accounting and inventory audits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <div className="p-3 bg-sky-100 text-sky-700 w-12 h-12 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Sales & Orders Report</h4>
                <p className="text-xs text-slate-500 mt-1">Complete order history, customer contact numbers, payment status, and revenue breakdown.</p>
              </div>
              <button
                disabled={downloading}
                onClick={() => handleDownloadReport('sales')}
                className="w-full bg-navy-gradient hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Sales CSV
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <div className="p-3 bg-emerald-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Inventory Audit Report</h4>
                <p className="text-xs text-slate-500 mt-1">SKU inventory list, purchase cost, selling price, current stock levels, and low stock alert thresholds.</p>
              </div>
              <button
                disabled={downloading}
                onClick={() => handleDownloadReport('inventory')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Inventory CSV
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
