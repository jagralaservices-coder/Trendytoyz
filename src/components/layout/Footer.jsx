import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Headphones, Lock, Heart, Phone, Mail, MapPin } from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-navy-gradient text-slate-300 pt-16 pb-8 border-t border-slate-800">
      {/* Trust Feature Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 border-b border-slate-800/60">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine</h4>
              <p className="text-xs text-slate-400">Authentic certified items</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Express Shipping</h4>
              <p className="text-xs text-slate-400">Fast delivery across India</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Easy Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free 7-day replacement</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Secure Payment</h4>
              <p className="text-xs text-slate-400">256-bit SSL encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Brand Info */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-slate-950 font-black flex items-center justify-center text-lg">
              TT
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">
              TRENDY<span className="text-sky-400">TOYZ</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed">
            TRENDYTOYZ is your ultimate destination for high-quality educational toys and fun play essentials.
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-400 shrink-0" />
              <a href="tel:+917718862274" className="hover:text-white transition font-semibold">+91 7718862274</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <a href="mailto:trendytoys.info@gmail.com" className="hover:text-white transition font-semibold">trendytoys.info@gmail.com</a>
            </div>
            <div className="flex items-center gap-2">
              <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0" />
              <a href="https://instagram.com/jgrl_co" target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 transition font-bold text-pink-400">
                @jgrl_co
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <span>Versova, Yari Road, Near D Mart, Andheri West, Mumbai - 400061</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 uppercase tracking-wider text-xs">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="hover:text-sky-400 transition">Shop All Products</Link></li>
            <li><Link to="/track-order" className="hover:text-sky-400 transition font-semibold text-sky-400">Track Order</Link></li>
            <li><Link to="/account" className="hover:text-sky-400 transition">My Account</Link></li>
            <li><Link to="/account/orders" className="hover:text-sky-400 transition">Order History</Link></li>
            <li><Link to="/cart" className="hover:text-sky-400 transition">View Cart</Link></li>
            <li><Link to="/admin/login" className="hover:text-amber-400 transition text-slate-500 text-xs">Admin Portal</Link></li>
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 uppercase tracking-wider text-xs">Categories</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/category/toys" className="hover:text-sky-400 transition">Educational & RC Toys</Link></li>
            <li><Link to="/category/wallets" className="hover:text-sky-400 transition">Genuine Leather Wallets</Link></li>
            <li><Link to="/shop?bestSeller=true" className="hover:text-sky-400 transition">Best Sellers</Link></li>
            <li><Link to="/shop?newArrival=true" className="hover:text-sky-400 transition">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Column 4: Customer Policies */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 uppercase tracking-wider text-xs">Legal & Policies</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-sky-400 transition">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-sky-400 transition">Contact Us</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-sky-400 transition">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-sky-400 transition">Terms & Conditions</Link></li>
            <li><Link to="/refund-policy" className="hover:text-sky-400 transition">Return & Refund Policy</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-sky-400 transition">Shipping Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright & Accepted Payment Methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div>
          © {new Date().getFullYear()} <span className="font-bold text-white">TRENDYTOYZ</span>. All rights reserved.
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">Accepted Payments:</span>
          <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded font-bold">UPI</span>
          <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded font-bold">Razorpay</span>
          <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded font-bold">Cards</span>
          <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded font-bold">NetBanking</span>
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">COD Available</span>
        </div>
      </div>
    </footer>
  );
}
