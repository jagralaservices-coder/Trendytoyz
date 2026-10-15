import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { api } from '../services/api';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      setLoading(true);
      try {
        const catRes = await api.getCategories();
        if (catRes.success) {
          const match = catRes.categories.find(c => c.slug === slug.toLowerCase());
          setCategory(match || { name: slug.charAt(0).toUpperCase() + slug.slice(1), slug });
        }

        const prodRes = await api.getProducts({ category: slug, limit: 24 });
        if (prodRes.success) {
          setProducts(prodRes.products);
        }
      } catch (err) {
        console.error('Category page load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryData();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Category Hero Header */}
      <div className="bg-navy-gradient text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 space-y-2">
          <div className="text-sky-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Link to="/shop" className="hover:underline">Shop</Link> / <span>{category?.name}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{category?.name} Collection</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl">
            {category?.description || `Explore our high-quality range of ${category?.name} crafted for style and reliability.`}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-200 h-80 rounded-2xl"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <h3 className="text-xl font-bold text-slate-800">No products found in {category?.name}</h3>
          <p className="text-sm text-slate-500">Check back soon or explore our full catalogue.</p>
          <Link to="/shop" className="inline-block bg-navy-gradient text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm">
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
}
