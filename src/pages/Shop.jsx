import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ProductFilter from '../components/product/ProductFilter';
import { api } from '../services/api';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialBestSeller = searchParams.get('bestSeller') || '';
  const initialFeatured = searchParams.get('featured') || '';
  const initialNewArrival = searchParams.get('newArrival') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then(res => {
      if (res.success) setCategories(res.categories);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedCategory, searchQuery, minPrice, maxPrice, inStockOnly, sortOption, page]);

  async function fetchFilteredProducts() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort: sortOption
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (inStockOnly) params.inStock = 'true';
      if (initialBestSeller) params.bestSeller = 'true';
      if (initialFeatured) params.featured = 'true';
      if (initialNewArrival) params.newArrival = 'true';

      const data = await api.getProducts(params);
      if (data.success) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Error loading shop products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePriceChange = (type, val) => {
    if (type === 'min') setMinPrice(val);
    else setMaxPrice(val);
    setPage(1);
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortOption('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title & Sorting Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shop Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing {totalCount} authentic products available for online payment & Cash on Delivery
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span>Filters</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm text-sm font-semibold text-slate-700">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Popularity & Best Sellers</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block md:col-span-1">
          <ProductFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(slug) => {
              setSelectedCategory(slug);
              setPage(1);
            }}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            inStockOnly={inStockOnly}
            onStockToggle={(checked) => {
              setInStockOnly(checked);
              setPage(1);
            }}
            onResetFilters={handleReset}
          />
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="md:hidden col-span-1">
            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug);
                setMobileFilterOpen(false);
                setPage(1);
              }}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
              inStockOnly={inStockOnly}
              onStockToggle={(checked) => {
                setInStockOnly(checked);
                setPage(1);
              }}
              onResetFilters={handleReset}
            />
          </div>
        )}

        {/* Products Grid */}
        <div className="md:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-200 h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-slate-700 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-xl font-bold text-slate-800">No products match your filter criteria</h3>
              <p className="text-sm text-slate-500">Try adjusting your category selection, search terms or price filter.</p>
              <button
                onClick={handleReset}
                className="bg-navy-gradient text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
