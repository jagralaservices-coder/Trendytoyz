import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User, Truck, Grid } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function MobileNav() {
  const location = useLocation();
  const { totalCount } = useCart();
  const { wishlistCount } = useWishlist();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex justify-around items-center shadow-lg">
      <Link
        to="/"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition ${isActive('/') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </Link>

      <Link
        to="/shop"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition ${isActive('/shop') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <Grid className="w-5 h-5" />
        <span>Shop</span>
      </Link>

      <Link
        to="/track-order"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition ${isActive('/track-order') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <Truck className="w-5 h-5" />
        <span>Track</span>
      </Link>

      <Link
        to="/account/wishlist"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition relative ${isActive('/account/wishlist') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <Heart className="w-5 h-5" />
        {wishlistCount > 0 && (
          <span className="absolute top-0 right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {wishlistCount}
          </span>
        )}
        <span>Wishlist</span>
      </Link>

      <Link
        to="/cart"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition relative ${isActive('/cart') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <ShoppingBag className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute top-0 right-1 bg-sky-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {totalCount}
          </span>
        )}
        <span>Cart</span>
      </Link>

      <Link
        to="/account"
        className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition ${isActive('/account') ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
      >
        <User className="w-5 h-5" />
        <span>Account</span>
      </Link>
    </div>
  );
}
