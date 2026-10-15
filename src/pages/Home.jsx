import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Star, Truck, Award, Gift, ChevronRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { api } from '../services/api';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [toysList, setToysList] = useState([]);
  const [walletsList, setWalletsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [banRes, featRes, bestRes, newRes, allRes] = await Promise.all([
          api.getBanners(),
          api.getProducts({ featured: 'true', limit: 8 }),
          api.getProducts({ bestSeller: 'true', limit: 8 }),
          api.getProducts({ newArrival: 'true', limit: 8 }),
          api.getProducts({ limit: 12 })
        ]);

        if (banRes.success) setBanners(banRes.banners);
        const catalogProducts = allRes.success ? allRes.products : [];
        setFeaturedProducts(featRes.success && featRes.products.length > 0 ? featRes.products : catalogProducts.slice(0, 4));
        setBestSellers(bestRes.success && bestRes.products.length > 0 ? bestRes.products : catalogProducts.slice(4, 8));
        setNewArrivals(newRes.success && newRes.products.length > 0 ? newRes.products : catalogProducts.slice(0, 8));
        setToysList(catalogProducts);
        setWalletsList(catalogProducts.filter(p => p.category_name?.toLowerCase().includes('wallet') || p.subcategory?.toLowerCase().includes('wallet')));
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const defaultBanner = {
    title: 'Experience Premium Craftsmanship & Fun',
    subtitle: 'Explore Toys & Handcrafted Genuine Leather Wallets',
    image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    button_text: 'Explore Collection',
    button_url: '/shop'
  };

  const activeBanner = banners.length > 0 ? banners[0] : defaultBanner;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden rounded-3xl mx-4 sm:mx-6 mt-4 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={activeBanner.image_url}
            alt={activeBanner.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col justify-center max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Exclusive Indian Brand Collection</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
            {activeBanner.title}
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
            {activeBanner.subtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              to={activeBanner.button_url || '/shop'}
              className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl transition shadow-lg hover:shadow-sky-500/25 flex items-center gap-2 text-sm"
            >
              <span>{activeBanner.button_text || 'Shop Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track-order"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl backdrop-blur-md border border-white/20 text-sm transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Track Existing Order</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Business Categories Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Our Signature Categories
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Curated premium ranges designed for modern lifestyles
            </p>
          </div>
          <Link to="/shop" className="text-sky-600 font-bold text-sm hover:text-sky-700 flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Toys Card */}
          <Link
            to="/category/toys"
            className="group relative h-80 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-500 flex flex-col justify-end p-8 text-white"
          >
            <img
              src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80"
              alt="Toys Collection"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div className="relative z-10">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full mb-2 inline-block">
                Educational & RC
              </span>
              <h3 className="text-3xl font-black">Toys Collection</h3>
              <p className="text-xs text-slate-300 mt-1">Remote control cars, STEM building blocks & learning kits</p>
              <div className="mt-4 flex items-center gap-1 font-bold text-xs text-sky-400 group-hover:translate-x-1 transition">
                <span>Shop Toys Range</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Wallets Card */}
          <Link
            to="/category/wallets"
            className="group relative h-80 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-500 flex flex-col justify-end p-8 text-white"
          >
            <img
              src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"
              alt="Wallets Collection"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div className="relative z-10">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full mb-2 inline-block">
                Genuine Leather
              </span>
              <h3 className="text-3xl font-black">Wallets Collection</h3>
              <p className="text-xs text-slate-300 mt-1">RFID blocking bifold leather wallets & aluminum cardholders</p>
              <div className="mt-4 flex items-center gap-1 font-bold text-xs text-sky-400 group-hover:translate-x-1 transition">
                <span>Shop Leather Accessories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Products
              </h2>
              <p className="text-slate-500 text-sm mt-1">Handpicked customer favorites with peak ratings</p>
            </div>
            <Link to="/shop?featured=true" className="text-sky-600 font-bold text-sm hover:text-sky-700 flex items-center gap-1">
              <span>View All Featured</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Toys Section */}
      {toysList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-amber-800 text-xs font-bold uppercase tracking-widest bg-amber-200/60 px-3 py-1 rounded-full">
                  Kids & Hobbyist Corner
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Toys & Action Gear
                </h2>
              </div>
              <Link to="/category/toys" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm">
                Explore All Toys
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {toysList.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Best Selling Items
              </h2>
              <p className="text-slate-500 text-sm mt-1">Trending products loved by hundreds of shoppers</p>
            </div>
            <Link to="/shop?bestSeller=true" className="text-sky-600 font-bold text-sm hover:text-sky-700 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Promotional Offers Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-navy-gradient text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <span className="bg-sky-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Limited Period Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Get Extra 10% Off On Your First Order
            </h2>
            <p className="text-slate-300 text-sm">
              Use promo code <strong className="text-sky-300 bg-white/10 px-2 py-0.5 rounded border border-white/20 font-mono">TRENDY10</strong> during checkout. Applicable on all Toys & Play Essentials!
            </p>
          </div>

          <div className="z-10 flex flex-col sm:flex-row gap-4">
            <Link to="/shop" className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl transition text-center shadow-lg">
              Shop Now & Save
            </Link>
          </div>
        </div>
      </section>

      {/* Verified Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Loved By Thousands of Customers
          </h2>
          <p className="text-slate-500 text-sm mt-1">Real feedback from verified buyers across India</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-slate-700 text-sm leading-relaxed italic">
              "Ordered the Remote Control Monster Truck for my son's birthday. The battery life is impressive and the truck handles rough ground easily! Delivered in 3 days."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                R
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Rajesh Sharma</h4>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Buyer (Delhi)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-slate-700 text-sm leading-relaxed italic">
              "The 500 Pcs STEM Building Blocks set is fantastic! Kept my kids engaged for hours without screen time. Solid brick quality and fast shipping."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                P
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Priya Malhotra</h4>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Buyer (Mumbai)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-slate-700 text-sm leading-relaxed italic">
              "Genuine RFID Leather Wallet comes packaged in a premium gift box. The leather feel is authentic and card slot pop-up works smoothly. Worth every rupee."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                A
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Amitabh Verma</h4>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Buyer (Bengaluru)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
