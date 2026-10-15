import React, { useState } from 'react';
import { X, Printer, Package, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

// Generates SVG barcode representation of text
function BarcodeSVG({ value }) {
  const cleanVal = (value || 'TTZ').replace(/[^a-zA-Z0-9-]/g, '');
  // Generate deterministic bar widths from characters
  const bars = [];
  let seed = 0;
  for (let i = 0; i < cleanVal.length; i++) {
    seed += cleanVal.charCodeAt(i);
  }

  // Create pattern of 60 bars
  for (let i = 0; i < 64; i++) {
    const width = ((seed * (i + 13)) % 3) + 1;
    const isBar = (i % 2 === 0) || ((seed * (i + 7)) % 4 === 0);
    bars.push({ width, isBar });
  }

  let currentX = 10;

  return (
    <div className="flex flex-col items-center">
      <svg className="w-full h-12 max-w-[280px]" viewBox="0 0 240 45">
        {bars.map((b, idx) => {
          const x = currentX;
          currentX += b.width * 2.2;
          return b.isBar ? (
            <rect key={idx} x={x} y="0" width={b.width * 1.8} height="40" fill="#000" />
          ) : null;
        })}
      </svg>
      <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-0.5">
        *{cleanVal}*
      </span>
    </div>
  );
}

export default function ShippingLabelModal({ orders = [], storeSettings = {}, onClose }) {
  const [format, setFormat] = useState('thermal'); // 'thermal' (4x6 / A6) or 'a4'

  if (!orders || orders.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const seller = {
    name: storeSettings.business_name || storeSettings.brand_name || 'TRENDYTOYZ Retail',
    address: storeSettings.business_address || 'Versova, Yari Road, Near D Mart, Andheri West',
    city: storeSettings.business_city || 'Mumbai',
    state: storeSettings.business_state || 'Maharashtra',
    pincode: storeSettings.business_pincode || '400061',
    phone: storeSettings.business_phone || storeSettings.support_phone || '+91 7718862274',
    email: storeSettings.business_email || storeSettings.support_email || 'trendytoys.info@gmail.com',
    gstin: storeSettings.gstin || '27DHHPJ9326M1ZQ'
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      {/* Top Floating Controls Bar (Hidden during print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-300 shadow-2xl rounded-2xl p-3 flex items-center gap-3 z-50 print:hidden">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
          <button
            onClick={() => setFormat('thermal')}
            className={`px-3 py-1.5 rounded-lg transition ${
              format === 'thermal' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thermal 4x6" (A6)
          </button>
          <button
            onClick={() => setFormat('a4')}
            className={`px-3 py-1.5 rounded-lg transition ${
              format === 'a4' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A4 Standard Sheet
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print {orders.length} Label{orders.length > 1 ? 's' : ''}</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Container */}
      <div className="w-full max-w-4xl pt-20 pb-10 space-y-8 print:p-0 print:m-0 print:space-y-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-shipping-labels, #printable-shipping-labels * {
              visibility: visible;
            }
            #printable-shipping-labels {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }
            .shipping-label-card {
              page-break-after: always;
              break-after: page;
              border: 2px solid #000 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
            }
            @page {
              size: ${format === 'thermal' ? '4in 6in' : 'A4 portrait'};
              margin: ${format === 'thermal' ? '0.1in' : '0.5in'};
            }
          }
        `}} />

        <div id="printable-shipping-labels" className="space-y-8 print:space-y-0">
          {orders.map((order, orderIndex) => {
            const addr = order.shipping_address || {};
            const isCod = (order.payment_method || '').toUpperCase() === 'COD';
            const totalWeight = order.items?.reduce((sum, item) => sum + (0.5 * (item.quantity || 1)), 0) || 0.5;

            return (
              <div
                key={order.id || orderIndex}
                className={`shipping-label-card bg-white border-2 border-black rounded-xl p-5 mx-auto font-sans text-black shadow-lg ${
                  format === 'thermal' ? 'max-w-[420px]' : 'max-w-[650px]'
                }`}
              >
                {/* 1. Header Bar: Brand + Courier details */}
                <div className="border-b-2 border-black pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-1.5">
                      <span>TRENDY<span className="text-sky-600">TOYZ</span></span>
                      <span className="text-[10px] font-bold border border-black px-1.5 py-0.5 rounded uppercase">PREMIUM TOYS</span>
                    </h2>
                    <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
                      Order Date: {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black uppercase block tracking-wider">
                      {order.courier_name || 'COURIER DISPATCH'}
                    </span>
                    {order.tracking_number ? (
                      <span className="font-mono text-[11px] font-bold block">
                        AWB: {order.tracking_number}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic block">AWB Pending</span>
                    )}
                  </div>
                </div>

                {/* 2. Primary Barcode Section */}
                <div className="py-3 border-b-2 border-black text-center bg-slate-50/50">
                  <BarcodeSVG value={order.id} />
                </div>

                {/* 3. Payment Mode & Collection Alert */}
                <div className="border-b-2 border-black py-2.5 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase">Payment:</span>
                    <span className={`px-2.5 py-1 text-xs font-black uppercase rounded ${
                      isCod ? 'bg-black text-white' : 'border-2 border-black bg-white text-black'
                    }`}>
                      {isCod ? 'CASH ON DELIVERY (COD)' : 'PREPAID - DO NOT COLLECT'}
                    </span>
                  </div>

                  {isCod ? (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block leading-tight">Amount To Collect</span>
                      <span className="text-base font-black tracking-tight">₹{Math.round(order.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div className="text-right text-[11px] font-black text-slate-700">
                      ₹0 TO COLLECT
                    </div>
                  )}
                </div>

                {/* 4. SHIP TO (Customer Destination Address) */}
                <div className="border-b-2 border-black p-3 space-y-1 bg-amber-50/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black underline">
                      DELIVER TO (CUSTOMER):
                    </span>
                    <span className="font-mono font-black text-sm bg-black text-white px-2 py-0.5 rounded">
                      PIN: {addr.pincode || '------'}
                    </span>
                  </div>

                  <p className="font-black text-sm uppercase leading-tight pt-1">
                    {order.customer_name}
                  </p>
                  <p className="text-xs font-semibold leading-snug text-slate-900">
                    {addr.street || addr.street_address}
                    {addr.landmark ? `, Near ${addr.landmark}` : ''}
                  </p>
                  <p className="text-xs font-extrabold uppercase">
                    {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                  </p>
                  <p className="text-xs font-black pt-1">
                    Phone: <span className="font-mono text-sm">{order.customer_phone}</span>
                    {addr.alternate_phone ? <span className="font-mono font-normal ml-2 text-slate-600">/ Alt: {addr.alternate_phone}</span> : ''}
                  </p>
                </div>

                {/* 5. SHIP FROM (Seller Address) */}
                <div className="border-b-2 border-black p-3 text-[11px] space-y-0.5 bg-slate-50/50">
                  <span className="font-black text-[10px] uppercase tracking-wider text-slate-700 block">
                    IF UNDELIVERED, RETURN TO (SELLER):
                  </span>
                  <p className="font-extrabold uppercase leading-tight">{seller.name}</p>
                  <p className="text-slate-800 leading-snug">{seller.address}</p>
                  <p className="font-bold">
                    {seller.city}, {seller.state} - {seller.pincode} | Tel: {seller.phone}
                  </p>
                  {seller.gstin && (
                    <p className="text-[10px] font-mono text-slate-600 font-semibold">
                      GSTIN: {seller.gstin}
                    </p>
                  )}
                </div>

                {/* 6. Package Contents & Weight summary */}
                <div className="border-b-2 border-black p-2.5 text-[11px]">
                  <div className="flex justify-between items-center font-bold pb-1 mb-1 border-b border-dashed border-slate-300">
                    <span>Contents ({order.items?.length || 0} items)</span>
                    <span className="font-mono">Est. Weight: ~{totalWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="truncate max-w-[240px] font-semibold">
                          {idx + 1}. {it.product_name} {it.variant ? `(${it.variant})` : ''}
                        </span>
                        <span className="font-mono font-bold shrink-0">Qty: {it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Footer Fragile & Barcode note */}
                <div className="p-2.5 flex items-center justify-between text-[10px] font-extrabold uppercase bg-slate-100">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>FRAGILE - HANDLE WITH CARE (TOY ITEM)</span>
                  </div>
                  <span className="font-mono text-slate-500">#{order.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
