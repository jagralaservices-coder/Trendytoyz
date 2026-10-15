import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Banknote, Truck, Lock, AlertCircle, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(!!window.Razorpay));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script from official domain.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, coupon, clearCart } = useCart();
  const { user } = useAuth();

  const [customerDetails, setCustomerDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const isCodBlocked = cartItems.some(item => item.is_cod_available === 0 || item.is_cod_available === false);

  useEffect(() => {
    if (isCodBlocked && paymentMethod === 'COD') {
      setPaymentMethod('ONLINE');
    }
  }, [isCodBlocked, paymentMethod]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    if (user) {
      api.getAddresses().then(res => {
        if (res.success && res.addresses.length > 0) {
          setSavedAddresses(res.addresses);
          const def = res.addresses.find(a => a.is_default) || res.addresses[0];
          setCustomerDetails({
            name: def.full_name,
            email: def.email || user.email,
            phone: def.phone,
            address: def.street_address,
            city: def.city,
            state: def.state,
            pincode: def.pincode
          });
        }
      }).catch(console.error);
    }

    fetchSummary();
  }, [paymentMethod, coupon]);

  async function fetchSummary() {
    try {
      const data = await api.calculateSummary({
        items: cartItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, variant: i.variant })),
        paymentMethod,
        couponCode: coupon?.code
      });
      if (data.success) {
        setSummary(data);
      }
    } catch (err) {
      setError(err.message || 'Error calculating summary');
    }
  }

  const handleAddressSelect = (addr) => {
    setCustomerDetails({
      name: addr.full_name,
      email: addr.email || user?.email || '',
      phone: addr.phone,
      address: addr.street_address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Order karne ke liye Sign In compulsory hai. Please sign in to complete your order.');
      const authElem = document.getElementById('checkout-auth-section');
      if (authElem) authElem.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address || !customerDetails.pincode) {
      setError('Please complete all required delivery address fields.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customerDetails,
        items: cartItems.map(i => ({ id: i.id, quantity: i.quantity, variant: i.variant })),
        paymentMethod,
        couponCode: coupon?.code
      };

      const res = await api.placeOrder(orderPayload);

      if (!res.success) {
        throw new Error(res.error || 'Failed to place order');
      }

      if (paymentMethod === 'COD') {
        // COD Order placed successfully
        clearCart();
        navigate(`/order-confirmation/${res.orderId}`, { state: { order: res, cod: true } });
      } else {
        // Online Payment Flow (Razorpay Gateway)
        const options = {
          key: res.razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_To0voa1HArstTq',
          amount: res.amount,
          currency: res.currency || 'INR',
          name: 'TRENDYTOYZ',
          description: `Order #${res.orderId}`,
          image: '/favicon.svg',
          order_id: res.razorpayOrderId || undefined,
          handler: async function (response) {
            setLoading(true);
            try {
              // Server-side HMAC-SHA256 payment verification
              const verifyRes = await api.verifyPayment({
                orderId: res.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.success) {
                clearCart();
                navigate(`/order-confirmation/${res.orderId}`, { state: { order: verifyRes } });
              } else {
                setError(verifyRes.error || 'Payment signature verification failed.');
              }
            } catch (err) {
              setError(err.message || 'Payment verification failed.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.phone
          },
          theme: {
            color: '#0B192C'
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setError('Payment window closed. You can retry checkout whenever ready.');
            }
          }
        };

        let isLoaded = !!window.Razorpay;
        if (!isLoaded) {
          isLoaded = await loadRazorpayScript();
        }

        if (isLoaded && window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (failResponse) {
            setLoading(false);
            const failReason = failResponse.error?.description || failResponse.error?.reason || 'Payment failed.';
            setError(`Payment Failed: ${failReason}`);
          });
          rzp.open();
        } else {
          setError('Razorpay payment gateway load nahi ho paya. Aap Cash on Delivery (COD) se order place kar sakte hain.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Error processing checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Checkout</h1>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          {!isCodBlocked && paymentMethod === 'ONLINE' && (
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('COD');
                setError('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition shadow-sm cursor-pointer"
            >
              Order via Cash on Delivery (COD) Instead
            </button>
          )}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Customer Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mandatory Sign-In Status Card */}
          <div id="checkout-auth-section">
            {!user ? (
              <div className="bg-gradient-to-br from-sky-50 via-white to-amber-50/40 rounded-3xl border-2 border-sky-300 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-base">Sign In Required to Complete Order</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Order place karne ke liye Sign In compulsory hai. Isse aapki order history, live parcel tracking, aur invoice hamesha aapke account me surakshit rahenge.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/account/login?redirect=/checkout"
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-center rounded-2xl shadow-md transition text-xs flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/account/register?redirect=/checkout"
                    className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-center rounded-2xl transition text-xs flex items-center justify-center"
                  >
                    <span>Create New Account</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block text-emerald-950">Signed in as {user.name}</span>
                    <span className="text-emerald-700 text-[11px]">{user.email} • Order history will be saved to this account</span>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                  Verified Account
                </span>
              </div>
            )}
          </div>

          {/* Saved Addresses for Logged in Users */}
          {savedAddresses.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base">Select Saved Delivery Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map(addr => (
                  <button
                    type="button"
                    key={addr.id}
                    onClick={() => handleAddressSelect(addr)}
                    className="text-left p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition"
                  >
                    <span className="font-bold text-slate-900 text-xs block">{addr.full_name} ({addr.phone})</span>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {addr.street_address}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Delivery Details Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Delivery Address Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="rahul@example.com (For order invoice & updates)"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Street Address / Flat / Landmark *</label>
              <textarea
                required
                rows={2}
                placeholder="House No., Street Name, Landmark"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="New Delhi"
                  value={customerDetails.city}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="Delhi"
                  value={customerDetails.state}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="110001"
                  value={customerDetails.pincode}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-600" />
              <span>Payment Option</span>
            </h3>

            <div className="space-y-3">
              {/* Online Payment */}
              <label className={`block p-4 rounded-2xl border cursor-pointer transition ${
                paymentMethod === 'ONLINE' ? 'bg-sky-50/60 border-sky-500 shadow-sm' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === 'ONLINE'}
                      onChange={() => setPaymentMethod('ONLINE')}
                      className="w-4 h-4 text-sky-600"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-sky-600" /> Online Payment (UPI / Cards / NetBanking)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">Secure payment via Razorpay / PhonePe gateway</p>
                    </div>
                  </div>
                  <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded">FAST</span>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label className={`block p-4 rounded-2xl border transition ${
                isCodBlocked
                  ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                  : paymentMethod === 'COD'
                    ? 'bg-sky-50/60 border-sky-500 shadow-sm cursor-pointer'
                    : 'bg-slate-50 border-slate-200 cursor-pointer'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      disabled={isCodBlocked}
                      checked={paymentMethod === 'COD' && !isCodBlocked}
                      onChange={() => !isCodBlocked && setPaymentMethod('COD')}
                      className="w-4 h-4 text-sky-600 disabled:opacity-40"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Banknote className={`w-4 h-4 ${isCodBlocked ? 'text-slate-400' : 'text-emerald-600'}`} /> Cash on Delivery (COD)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isCodBlocked
                          ? 'Unavailable because items in your cart only accept Online Payment.'
                          : 'Pay in cash when package is delivered to your doorstep (+₹50 COD charge)'}
                      </p>
                    </div>
                  </div>
                  {isCodBlocked ? (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">UNAVAILABLE</span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">AVAILABLE</span>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary & Confirmation CTA */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.variant}`} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={item.primary_image} alt={item.name} className="w-9 h-9 object-cover rounded-lg bg-slate-100" />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {summary && (
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{summary.subtotal.toLocaleString('en-IN')}</span>
                </div>

                {summary.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- ₹{summary.couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-slate-900">
                    {summary.shippingCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${summary.shippingCharge}`}
                  </span>
                </div>

                {summary.codCharge > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>COD Handling Charge</span>
                    <span className="font-bold">₹{summary.codCharge}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-base font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-sky-600">₹{summary.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Cancellation & No-Return Policy Card */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Cancellation & Return Policy:</span>
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900">
                <strong>Orders can be cancelled only before dispatch. Once an order is dispatched, it cannot be cancelled or returned.</strong>
              </p>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={() => {
                  const authElem = document.getElementById('checkout-auth-section');
                  if (authElem) authElem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-navy-gradient hover:bg-slate-800 text-white font-extrabold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <Lock className="w-4 h-4 text-sky-400" />
                <span>Sign In Required to Place Order</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-gradient hover:bg-slate-800 text-white font-extrabold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>{paymentMethod === 'COD' ? 'Place COD Order' : 'Pay Online Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
