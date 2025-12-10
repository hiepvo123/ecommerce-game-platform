import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchCartCount();
    } else {
      setCart([]);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await cartService.getCartCount();
      setCartCount(response.data?.count || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const addToCart = async (appId) => {
    try {
      await cartService.addToCart(appId);
      await fetchCart();
      await fetchCartCount();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (appId) => {
    try {
      await cartService.removeFromCart(appId);
      await fetchCart();
      await fetchCartCount();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart([]);
      setCartCount(0);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    cart,
    cartCount,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    fetchCart,
    fetchCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
