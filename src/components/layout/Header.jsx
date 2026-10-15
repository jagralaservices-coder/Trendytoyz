import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, MapPin, Truck, ChevronDown, LogOut, ShieldCheck, Menu, X, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { totalCount, subtotal } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(res => {
      if (res.success) setCategories(res.categories);
    }).catch(console.error);
  }, []);

  // Search input live autocomplete
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        api.getProducts({ search: searchQuery.trim(), limit: 5 }).then(res => {
          if (res.success) {
            setSearchResults(res.products);
            setShowSearchDropdown(true);
          }
        }).catch(console.error);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  // Click outside listener for search dropdown & user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
      {/* Top Announcement Bar */}
      <div className="bg-navy-gradient text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-sky-500 text-navy-gradient text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Offer</span>
            <span>Free Express Shipping on Orders Above ₹799! Use Code <strong className="text-sky-300">TRENDY10</strong> for 10% Off</span>
          </div>
          <div className="flex items-center gap-6 text-slate-300 font-medium">
            <Link to="/track-order" className="hover:text-white transition flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>Track Order</span>
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              Help & Support
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-navy-gradient text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-md group-hover:scale-105 transition transform">
            TT
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            TRENDY<span className="text-sky-600">TOYZ</span>
          </span>
        </Link>

        {/* Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg relative mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              type="text"
              placeholder="Search Toys, Wallets, Brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 bg-brand-navy hover:bg-slate-800 text-white font-medium text-xs rounded-full transition shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Matching Products
                  </div>
                  {searchResults.map(p => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                    >
                      <img src={p.primary_image} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{p.name}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-bold text-sky-600">₹{p.selling_price}</span>
                          {p.mrp > p.selling_price && (
                            <span className="line-through text-slate-400 text-[11px]">₹{p.mrp}</span>
                          )}
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.category_name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No products found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Wishlist */}
          <Link
            to="/account/wishlist"
            className="p-2 text-slate-700 hover:text-sky-600 hover:bg-slate-50 rounded-xl transition relative"
            title="Wishlist"
          >
            <Heart className="w-6 h-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Drawer Toggle / Cart Page */}
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-sky-400" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">₹{subtotal.toLocaleString('en-IN')}</span>
          </Link>

          {/* User Account Dropdown */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Admin User
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 transition"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Profile
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Package className="w-4 h-4 text-slate-400" /> My Orders
                    </Link>
                    <Link
                      to="/track-order"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Truck className="w-4 h-4 text-slate-400" /> Track Order
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/account/login"
                className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
              >
                <User className="w-5 h-5 text-slate-600" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Menu Bar */}
      <nav className="bg-slate-900 text-white text-sm border-t border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-11">
          <Link to="/" className="font-semibold text-slate-200 hover:text-white transition">
            Home
          </Link>
          <Link to="/shop" className="font-semibold text-slate-200 hover:text-white transition">
            All Products
          </Link>

          {/* Hardcoded Primary Business Categories */}
          <Link to="/category/toys" className="font-semibold text-slate-200 hover:text-sky-400 transition flex items-center gap-1">
            <span>Toys</span>
            <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.2 rounded font-bold">HOT</span>
          </Link>

          <Link to="/category/wallets" className="font-semibold text-slate-200 hover:text-sky-400 transition">
            Wallets
          </Link>

          {/* Dynamic Categories Created via Admin Panel */}
          {categories.filter(c => !['toys', 'wallets'].includes(c.slug.toLowerCase())).map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="font-semibold text-slate-200 hover:text-sky-400 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-white px-4 py-4 space-y-3 border-t border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 text-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium hover:text-sky-400 border-b border-slate-800"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium hover:text-sky-400 border-b border-slate-800"
          >
            Shop All Products
          </Link>
          <Link
            to="/category/toys"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium hover:text-sky-400 border-b border-slate-800"
          >
            Toys
          </Link>
          <Link
            to="/category/wallets"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium hover:text-sky-400 border-b border-slate-800"
          >
            Wallets
          </Link>
          <Link
            to="/track-order"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-sky-400 border-b border-slate-800 flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> Track Order
          </Link>
        </div>
      )}
    </header>
  );
}
