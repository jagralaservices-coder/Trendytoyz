import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {product.discount_percent > 0 && (
          <span className="bg-sky-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
            {product.discount_percent}% OFF
          </span>
        )}
        {product.is_best_seller === 1 && (
          <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
            BEST SELLER
          </span>
        )}
        {product.is_new_arrival === 1 && (
          <span className="bg-emerald-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
            NEW
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition ${
          isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-600 hover:text-rose-500 hover:bg-white'
        }`}
        aria-label="Save to wishlist"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Image Container */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={product.primary_image || '/favicon.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='18' fill='%2394a3b8'%3ETRENDYTOYZ%3C/text%3E%3C/svg%3E";
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">{product.brand || 'TRENDYTOYZ'}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{product.category_name}</span>
          </div>

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-slate-850 hover:text-sky-600 text-sm line-clamp-2 leading-snug transition">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>4.8</span>
          <span className="text-slate-400 font-normal text-[11px]">(24)</span>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900">₹{product.selling_price.toLocaleString('en-IN')}</span>
              {product.mrp > product.selling_price && (
                <span className="text-xs text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold ${product.is_cod_available === 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {product.is_cod_available === 1 ? 'COD' : 'Prepaid'}
              </span>
              <span className="text-slate-300 text-[10px]">•</span>
              {product.is_free_shipping ? (
                <span className="text-[10px] font-black text-emerald-600">Free Delivery</span>
              ) : product.shipping_charge > 0 ? (
                <span className="text-[10px] font-bold text-slate-500">₹{product.shipping_charge} Delivery</span>
              ) : (
                <span className="text-[10px] text-slate-400">Delivery</span>
              )}
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-navy-gradient hover:bg-slate-800 text-white active:scale-95'
            }`}
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
