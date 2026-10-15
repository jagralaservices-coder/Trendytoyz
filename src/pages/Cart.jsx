import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Tag, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const {
    cartItems,
    subtotal,
    totalCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon
  } = useCart();

  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const freeShippingThreshold = 799;
  const allFreeShipping = cartItems.length > 0 && cartItems.every(i => i.is_free_shipping === true || i.is_free_shipping === 1);
  const maxCustomShipping = Math.max(0, ...cartItems.map(i => parseFloat(i.shipping_charge || 0)));

  let shippingFee = 0;
  if (!allFreeShipping) {
    if (maxCustomShipping > 0) {
      shippingFee = maxCustomShipping;
    } else {
      shippingFee = subtotal >= freeShippingThreshold ? 0 : 49;
    }
  }
  const couponDiscount = coupon ? coupon.calculated_discount : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCoupon(couponInput.trim());
    setCouponLoading(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Explore our latest Toys & Leather Wallets collections to add items to your cart.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-navy-gradient text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition text-sm"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shopping Cart ({totalCount} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Cart Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {cartItems.map(item => (
              <div key={`${item.id}-${item.variant}`} className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                <img
                  src={item.primary_image}
                  alt={item.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl bg-slate-100"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{item.name}</h3>
                  {item.variant && (
                    <span className="inline-block text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {item.variant}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">₹{item.price.toLocaleString('en-IN')}</span>
                    {item.mrp > item.price && (
                      <span className="text-xs text-slate-400 line-through">₹{item.mrp.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right">
                  <span className="block font-black text-slate-900 text-sm sm:text-base">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id, item.variant)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 mt-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={clearCart}
              className="text-slate-500 hover:text-rose-600 font-semibold transition"
            >
              Clear Cart
            </button>
            <Link to="/shop" className="text-sky-600 font-bold hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Order Summary & Checkout */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {/* Coupon Application */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-600" /> Apply Coupon Code
              </label>

              {coupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-800">{coupon.code}</span>
                    <p className="text-emerald-700 text-[11px]">Saved ₹{coupon.calculated_discount}!</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. TRENDY10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${shippingFee}`}
                </span>
              </div>

              {!allFreeShipping && shippingFee > 0 && subtotal < freeShippingThreshold && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
                  Add ₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN')} more to qualify for FREE Shipping!
                </p>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-lg font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl text-sky-600">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-navy-gradient hover:bg-slate-800 text-white font-extrabold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
