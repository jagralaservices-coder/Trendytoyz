import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AlertCircle, ExternalLink, Settings, X, ShieldCheck } from 'lucide-react';

export default function SocialAuthButtons({ redirectTo = '/account', onSuccess, onError }) {
  const { loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [appleClientId, setAppleClientId] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customGoogleIdInput, setCustomGoogleIdInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    // Check locally stored client ID first
    const savedLocalGoogleId = localStorage.getItem('jgrl_google_client_id');

    // Fetch public settings to get configured Google & Apple Client IDs
    api.getPublicSettings().then(res => {
      if (res.success && res.settings) {
        const gId = res.settings.google_client_id || import.meta.env.VITE_GOOGLE_CLIENT_ID || savedLocalGoogleId || '';
        const aId = res.settings.apple_client_id || import.meta.env.VITE_APPLE_CLIENT_ID || '';
        if (gId) {
          setGoogleClientId(gId);
          initGoogleSignIn(gId);
        }
        if (aId) {
          setAppleClientId(aId);
        }
      }
    }).catch(console.error);
  }, []);

  const initGoogleSignIn = (clientId) => {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    } catch (err) {
      console.warn('Google Identity initialization error:', err);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setLoadingGoogle(true);
    try {
      const res = await loginWithGoogle({ credential: response.credential });
      if (res && res.success) {
        if (onSuccess) onSuccess(res.user);
        else navigate(redirectTo);
      } else {
        if (onError) onError(res?.error || 'Google sign in failed');
      }
    } catch (err) {
      if (onError) onError(err.message || 'Google sign in error');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleClick = () => {
    const activeClientId = googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('jgrl_google_client_id');

    if (!activeClientId) {
      // If no Google Client ID is configured yet, open configuration modal
      setShowConfigModal(true);
      return;
    }

    setLoadingGoogle(true);

    try {
      if (window.google?.accounts?.oauth2) {
        // Native Google Account Chooser Popup (Select Account from device)
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          prompt: 'select_account', // Forces Google to display the list of all accounts on device
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoadingGoogle(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                if (onError) onError(tokenResponse.error_description || 'Google login cancelled.');
              }
              return;
            }

            try {
              // Fetch user profile from Google UserInfo endpoint
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await userInfoRes.json();

              if (profile && profile.email) {
                const res = await loginWithGoogle({
                  email: profile.email,
                  name: profile.name || profile.email.split('@')[0],
                  avatar: profile.picture || '',
                  googleId: profile.sub
                });

                if (res && res.success) {
                  if (onSuccess) onSuccess(res.user);
                  else navigate(redirectTo);
                } else {
                  if (onError) onError(res?.error || 'Google authentication failed');
                }
              }
            } catch (err) {
              if (onError) onError(err.message || 'Failed to fetch Google profile');
            } finally {
              setLoadingGoogle(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } else if (window.google?.accounts?.id) {
        initGoogleSignIn(activeClientId);
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoadingGoogle(false);
          }
        });
      } else {
        setLoadingGoogle(false);
        if (onError) onError('Google Services are loading. Please check your internet connection and try again.');
      }
    } catch (err) {
      setLoadingGoogle(false);
      console.error('Google click error:', err);
      if (onError) onError(err.message || 'Google account chooser failed to open.');
    }
  };

  const handleAppleClick = async () => {
    setLoadingApple(true);
    try {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: appleClientId || 'co.jgrl.shop.auth',
          scope: 'name email',
          redirectURI: window.location.origin + '/account/login',
          usePopup: true
        });

        const data = await window.AppleID.auth.signIn();
        if (data && data.authorization) {
          const res = await loginWithApple({
            identityToken: data.authorization.id_token,
            email: data.user?.email,
            name: data.user ? `${data.user.name?.firstName || ''} ${data.user.name?.lastName || ''}`.trim() : undefined,
            user: data.authorization.id_token ? undefined : 'apple_user'
          });

          if (res && res.success) {
            if (onSuccess) onSuccess(res.user);
            else navigate(redirectTo);
          } else {
            if (onError) onError(res?.error || 'Apple login failed.');
          }
        }
      } else {
        if (onError) onError('Apple Sign In SDK is initializing. Please tap again in a moment.');
      }
    } catch (err) {
      if (err.error !== 'popup_closed_by_user') {
        if (onError) onError(err.error || err.message || 'Apple Sign-In cancelled.');
      }
    } finally {
      setLoadingApple(false);
    }
  };

  const handleSaveGoogleClientId = async (e) => {
    e.preventDefault();
    if (!customGoogleIdInput.trim()) return;

    setSavingKey(true);
    try {
      const res = await api.updateAdminSettings({
        google_client_id: customGoogleIdInput.trim()
      });
      if (res.success) {
        setGoogleClientId(customGoogleIdInput.trim());
        initGoogleSignIn(customGoogleIdInput.trim());
        setShowConfigModal(false);
        alert('Google Client ID connected! Click "Sign in with Google" to select your account.');
      } else {
        alert(res.error || 'Failed to save Google Client ID.');
      }
    } catch (err) {
      // If customer is not admin, save locally for seamless testing
      localStorage.setItem('jgrl_google_client_id', customGoogleIdInput.trim());
      setGoogleClientId(customGoogleIdInput.trim());
      initGoogleSignIn(customGoogleIdInput.trim());
      setShowConfigModal(false);
      alert('Google Client ID activated! Tap "Sign in with Google" now.');
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Social Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loadingGoogle || loadingApple}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loadingGoogle ? 'Opening Google...' : 'Sign in with Google'}</span>
        </button>

        {/* Apple Sign In Button (for iPhone & iOS users) */}
        <button
          type="button"
          onClick={handleAppleClick}
          disabled={loadingGoogle || loadingApple}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-black hover:bg-slate-900 border border-black rounded-xl text-xs font-bold text-white transition shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.77-11.66-14.21-6.1-9.58-10.83-20.2-14.19-31.85-3.36-11.66-5.04-22.95-5.04-33.87 0-14.45 3.65-26.68 10.95-36.68 7.3-10 16.63-15.17 27.99-15.52 4.89 0 10.13 1.34 15.71 4.02 5.58 2.68 9.38 4.08 11.4 4.2 1.68-.22 5.58-1.68 11.71-4.37 6.13-2.69 11.45-3.9 15.96-3.64 12.3.89 22.18 5.68 29.64 14.37-10.74 6.5-16.01 15.52-15.82 27.06.19 9.07 3.67 16.73 10.45 22.98 6.78 6.25 14.88 9.77 24.31 10.56-1.9 5.82-4.14 11.6-6.72 17.34zM119.22 33.37c-.12 3.82-1.39 7.6-3.81 11.34-2.42 3.74-5.69 6.88-9.81 9.42-3.56 2.24-7.39 3.55-11.49 3.93-.24-3.46.73-7.07 2.92-10.83 2.19-3.76 5.25-6.9 9.18-9.42 3.93-2.52 8.16-3.96 12.69-4.32.12-.06.2.04.32-.12z" />
          </svg>
          <span>{loadingApple ? 'Opening Apple ID...' : 'Sign in with Apple'}</span>
        </button>
      </div>

      {/* Google Setup Guide Modal (Displayed only if Google Client ID is not yet connected) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Google Account Setup</h4>
                  <p className="text-[11px] text-slate-500">Connect Google to select accounts on this device</p>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 text-xs text-sky-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-sky-900">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Google requires your Client ID to show your accounts:
              </p>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                To show the Google popup with all IDs logged in on this phone/computer, Google requires a free <strong>Google OAuth Client ID</strong> from Google Cloud Console.
              </p>
            </div>

            <form onSubmit={handleSaveGoogleClientId} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Enter Google Client ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                  value={customGoogleIdInput}
                  onChange={(e) => setCustomGoogleIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingKey}
                  className="flex-1 bg-navy-gradient text-white font-extrabold py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingKey ? 'Connecting...' : 'Connect Google Sign-In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="border-t border-slate-200 w-full"></div>
        <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative shrink-0">
          or continue with email
        </span>
      </div>
    </div>
  );
}
