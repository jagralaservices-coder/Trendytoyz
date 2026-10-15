import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('jgrl_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [coupon, setCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('jgrl_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    localStorage.setItem('jgrl_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem('jgrl_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('jgrl_coupon');
    }
  }, [coupon]);

  const addToCart = (product, quantity = 1, variant = '') => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id && item.variant === variant);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx].quantity = Math.min(newQty, product.stock_quantity || 99);
        return updated;
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.selling_price,
          mrp: product.mrp,
          primary_image: product.primary_image || (product.images && product.images[0]) || '',
          stock_quantity: product.stock_quantity,
          is_cod_available: product.is_cod_available !== undefined ? product.is_cod_available : 0,
          variant,
          quantity: Math.min(quantity, product.stock_quantity || 99)
        }];
      }
    });
  };

  const updateQuantity = (id, quantity, variant = '') => {
    if (quantity <= 0) {
      removeFromCart(id, variant);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.variant === variant) {
        return { ...item, quantity: Math.min(quantity, item.stock_quantity || 99) };
      }
      return item;
    }));
  };

  const removeFromCart = (id, variant = '') => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variant === variant)));
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setCouponError('');
  };

  const applyCoupon = async (code) => {
    setCouponError('');
    try {
      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const res = await api.validateCoupon(code, subtotal);
      if (res.success) {
        setCoupon(res.coupon);
        return { success: true, coupon: res.coupon };
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setCoupon(null);
      return { success: false, error: err.message };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCount,
        subtotal,
        coupon,
        couponError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
