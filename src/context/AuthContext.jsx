import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('jgrl_token');
      if (token) {
        try {
          const data = await api.getProfile();
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem('jgrl_token');
          }
        } catch (e) {
          localStorage.removeItem('jgrl_token');
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password, loginType = 'customer') => {
    const data = await api.login({ email, password, loginType });
    if (data.success) {
      localStorage.setItem('jgrl_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, phone, password) => {
    const data = await api.register({ name, email, phone, password });
    if (data.success) {
      localStorage.setItem('jgrl_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const loginWithGoogle = async (payload) => {
    const data = await api.googleLogin(payload);
    if (data.success) {
      localStorage.setItem('jgrl_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const loginWithApple = async (payload) => {
    const data = await api.appleLogin(payload);
    if (data.success) {
      localStorage.setItem('jgrl_token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jgrl_token');
    setUser(null);
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateProfileState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
