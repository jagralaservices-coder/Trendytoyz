import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, Check, MapPin, Share2, AlertCircle, MessageSquare, Banknote, CheckCircle, Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import MarketplaceBadges from '../components/product/MarketplaceBadges';
import ProductCard from '../components/product/ProductCard';
import { api } from '../services/api';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const reviewFileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [loading, setLoading] = useState(true);

  // Pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [uploadingReviewImage, setUploadingReviewImage] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewErr, setReviewErr] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.getProductBySlug(slug);
        if (data.success) {
          setProduct(data.product);
          setReviews(data.reviews || []);
          setRelated(data.related || []);
          setSelectedImage(data.product.primary_image || (data.product.images && data.product.images[0]) || '');
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0].name);
          }
        }
      } catch (err) {
        console.error('Product load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-200 h-96 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="bg-slate-200 h-8 w-3/4 rounded"></div>
            <div className="bg-slate-200 h-6 w-1/4 rounded"></div>
            <div className="bg-slate-200 h-24 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <Link to="/shop" className="inline-block bg-navy-gradient text-white px-6 py-2.5 rounded-xl font-bold text-sm">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity, selectedVariant);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity, selectedVariant);
      navigate('/checkout');
    }
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + 4);
      const isCod = product.is_cod_available === 1;
      setPincodeResult({
        success: true,
        message: `Delivery available to pincode ${pincode.trim()} by ${estDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}. ${
          isCod
            ? '✓ Cash on Delivery (COD) is supported for this item.'
            : 'ℹ Note: Prepaid / Online Payment only (Cash on Delivery is currently unavailable for this item).'
        }`,
        codAvailable: isCod
      });
    } else {
      setPincodeResult({
        success: false,
        message: 'Please enter a valid 6-digit Indian Pincode.'
      });
    }
  };

  const handleReviewImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReviewImage(true);
    setReviewErr('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadImage(formData);
      if (res.success && res.url) {
        setReviewImage(res.url);
      } else {
        setReviewErr(res.error || 'Failed to upload photo');
      }
    } catch (err) {
      setReviewErr(err.message || 'Error uploading photo');
    } finally {
      setUploadingReviewImage(false);
      if (reviewFileInputRef.current) reviewFileInputRef.current.value = '';
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    setReviewErr('');
    try {
      const res = await api.submitReview({
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment,
        image_url: reviewImage
      });
      if (res.success) {
        setReviewMsg(res.message);
        setReviewComment('');
        setReviewImage('');
        // Reload reviews
        const updated = await api.getProductBySlug(slug);
        if (updated.success) {
          setReviews(updated.reviews || []);
        }
      }
    } catch (err) {
      setReviewErr(err.message || 'Failed to post review');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Product Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Product Gallery */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden aspect-square relative shadow-sm">
            <img
              src={selectedImage || '/favicon.svg'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='18' fill='%2394a3b8'%3ETRENDYTOYZ%3C/text%3E%3C/svg%3E";
              }}
            />
            {product.discount_percent > 0 && (
              <span className="absolute top-4 left-4 bg-sky-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                {product.discount_percent}% OFF
              </span>
            )}
          </div>

          {/* Image Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition ${
                    selectedImage === img ? 'border-sky-600 scale-95 shadow-md' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='9' fill='%2394a3b8'%3ETOY%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase Panel */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">{product.category_name}</span>
              <span className="font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">4.8</span>
              <span className="text-slate-400 text-xs">({reviews.length + 18} Verified Ratings)</span>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.selling_price.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.selling_price && (
                <span className="text-slate-400 line-through text-lg">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">Inclusive of all taxes</span>
            </div>

            {/* COD Status Indicator */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
              {product.is_cod_available === 1 ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-xl">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery Available</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Online Payment Only (COD Unavailable)</span>
                </span>
              )}
            </div>
          </div>

          {/* Short description */}
          <p className="text-slate-600 text-sm leading-relaxed">
            {product.short_description || product.description}
          </p>

          {/* Variants selector if available */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Option / Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedVariant === v.name
                        ? 'bg-navy-gradient text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Main Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-extrabold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity || 99, q + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>

              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock_quantity} left)`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-navy-gradient hover:bg-slate-800 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5 text-sky-400" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition text-sm disabled:opacity-50"
              >
                Buy Now
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-center ${
                  isFavorite ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
                title="Save to wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Shipping Charges Status Badge */}
          {product.is_free_shipping ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-900 block">🎉 100% FREE Delivery Across India</span>
                <span className="text-[11px] text-emerald-700 font-medium">No minimum purchase required for this product. ₹0 Shipping!</span>
              </div>
            </div>
          ) : product.shipping_charge > 0 ? (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sky-950 block">Express Delivery: ₹{product.shipping_charge}</span>
                <span className="text-[11px] text-sky-700 font-medium">Standard express courier charges apply on this item.</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block">Express Shipping Available</span>
                <span className="text-[11px] text-slate-600 font-medium">Free delivery on orders above ₹799 (₹49 for smaller orders).</span>
              </div>
            </div>
          )}

          {/* Delivery & Pincode Checker */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <span>Check Delivery & COD Availability</span>
            </h4>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode (e.g. 400061)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Check
              </button>
            </form>

            {pincodeResult && (
              <p className={`text-xs font-semibold ${pincodeResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                {pincodeResult.message}
              </p>
            )}
          </div>

          {/* Cancellation & No-Return Policy Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-1.5 font-black text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Cancellation & No-Return Policy</span>
            </div>
            <p className="text-amber-950 leading-snug">
              <strong>Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.</strong>
            </p>
            <p className="text-[11px] text-amber-800">
              * Exception: If a damaged or wrong item is received, report within 48 hours of delivery with unboxing video/photo proof.
            </p>
          </div>

          {/* Marketplace Badges (Amazon, Flipkart, Meesho) */}
          <MarketplaceBadges
            amazonUrl={product.amazon_url}
            flipkartUrl={product.flipkart_url}
            meeshoUrl={product.meesho_url}
          />
        </div>
      </div>

      {/* Key Features & Description Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900">Product Features & Specifications</h3>

        {product.key_features && product.key_features.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.key_features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-slate-100 pt-6">
          <h4 className="font-bold text-slate-900 text-sm mb-2">Detailed Description</h4>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      </div>

      {/* Verified Customer Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-600" />
              <span>Customer Reviews ({reviews.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Verified buyer evaluations</p>
          </div>
        </div>

        {/* Submit Review Form (For Logged in Users) */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Leave a Product Review</h4>
            {reviewMsg && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{reviewMsg}</p>}
            {reviewErr && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{reviewErr}</p>}

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Your Rating *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="p-1 focus:outline-none transition hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {reviewRating === 5 ? '5/5 Excellent' : reviewRating === 4 ? '4/5 Very Good' : reviewRating === 3 ? '3/5 Average' : reviewRating === 2 ? '2/5 Poor' : '1/5 Terrible'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Your Review *</label>
              <textarea
                placeholder="Share your experience with this toy or item..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              ></textarea>
            </div>

            {/* Photo Upload for Review */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Add Product / Unboxing Photo (Optional)</label>
              <input
                ref={reviewFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReviewImageSelect}
                className="hidden"
                id="review-photo-upload"
              />

              {reviewImage ? (
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 w-fit">
                  <img
                    src={reviewImage}
                    alt="Review attachment preview"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-100"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-700">Photo Attached ✓</p>
                    <button
                      type="button"
                      onClick={() => setReviewImage('')}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="review-photo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-sky-500 hover:bg-sky-50/30 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition shadow-xs"
                >
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>{uploadingReviewImage ? 'Uploading Photo...' : 'Upload Photo with Review'}</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={uploadingReviewImage}
              className="bg-navy-gradient hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              Submit Review
            </button>
          </form>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>Please login to submit a review with photos for this product.</span>
            <Link to="/account/login" className="bg-slate-900 text-white font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-slate-800 transition">
              Login to Review
            </Link>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(r => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{r.user_name}</span>
                    {r.is_verified_buyer === 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-amber-500 text-xs">
                    {[...Array(r.rating || 5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{r.comment}</p>

                {/* Review Photo Thumbnail */}
                {r.image_url && (
                  <div className="pt-1">
                    <img
                      src={r.image_url}
                      alt={`Review photo by ${r.user_name}`}
                      onClick={() => setPreviewModalImg(r.image_url)}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition shadow-xs bg-white"
                      title="Click to view full image"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Customer uploaded photo (Click to enlarge)</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No reviews submitted yet for this product. Be the first to review!</p>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Review Photo */}
      {previewModalImg && (
        <div
          className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-black rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewModalImg} alt="Customer product photo full size" className="w-full h-auto max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-slate-900">You May Also Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
