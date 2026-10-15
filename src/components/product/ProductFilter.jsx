import React from 'react';
import { Filter, RotateCcw, Check } from 'lucide-react';

export default function ProductFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  inStockOnly,
  onStockToggle,
  onResetFilters
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-600" />
          <span>Filters</span>
        </h3>
        <button
          onClick={onResetFilters}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Categories</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
              !selectedCategory ? 'bg-navy-gradient text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
            {!selectedCategory && <Check className="w-4 h-4 text-sky-400" />}
          </button>

          {categories.map(cat => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                  isSelected ? 'bg-navy-gradient text-white shadow-sm font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-sky-500/30 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.product_count ?? ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Price Range (₹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Min Price</label>
            <input
              type="number"
              placeholder="₹0"
              value={minPrice}
              onChange={(e) => onPriceChange('min', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Max Price</label>
            <input
              type="number"
              placeholder="₹5000"
              value={maxPrice}
              onChange={(e) => onPriceChange('max', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Stock Availability Toggle */}
      <div className="border-t border-slate-100 pt-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onStockToggle(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );
}
