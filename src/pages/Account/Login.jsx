import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const isFromCheckout = redirect.includes('checkout');

  const { login, updateProfileState } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isResetMode) {
        const res = await api.resetPassword({ email, newPassword });
        if (res.success) {
          localStorage.setItem('jgrl_token', res.token);
          if (updateProfileState) updateProfileState(res.user);
          setSuccessMsg('Password updated successfully! Logging you in...');
          setTimeout(() => navigate(redirect), 800);
        } else {
          setError(res.error || 'Password reset failed');
        }
      } else {
        const res = await login(email, password, 'customer');
        if (res.success) {
          navigate(redirect);
        } else {
          setError(res.error || 'Login failed');
        }
      }
    } catch (err) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center mx-auto font-black text-xl">
            TT
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isResetMode ? 'Reset Account Password' : 'Customer Login'}
          </h1>
          <p className="text-xs text-slate-500">
            {isResetMode ? 'Apna registered email aur naya password daalein' : 'Sign in to track orders, manage addresses & wishlist'}
          </p>
        </div>

        {/* If redirected from checkout, show friendly message */}
        {isFromCheckout && !isResetMode && (
          <div className="bg-sky-50 border border-sky-200 text-sky-900 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-xs">
            <ShoppingBag className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Order karne ke liye sign in zaroori hai.</strong> Please sign in to link your purchase to your account and easily access your order history & live shipment tracking.
            </p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {!isResetMode ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">Password</label>
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setError(''); setSuccessMsg(''); }}
                  className="text-[11px] font-bold text-sky-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password (Min 6 characters)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Naya password daalein"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-gradient hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? (isResetMode ? 'Updating Password...' : 'Logging in...') : (isResetMode ? 'Update Password & Sign In' : 'Sign In with Email')}
            <ArrowRight className="w-4 h-4" />
          </button>

          {isResetMode && (
            <button
              type="button"
              onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              ← Back to Login
            </button>
          )}
        </form>

        {!isResetMode && (
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Don't have an account?{' '}
            <Link
              to={isFromCheckout ? `/account/register?redirect=${encodeURIComponent(redirect)}` : '/account/register'}
              className="text-sky-600 font-bold hover:underline"
            >
              Register New Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
