// frontend/src/services/wishlistService.js

import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const res = await api.get('/wishlist');
    return res.data;
  },

  addToWishlist: async (appId) => {
    const res = await api.post('/wishlist', { appId });
    return res.data;
  },

  removeFromWishlist: async (appId) => {
    const res = await api.delete(`/wishlist/${appId}`);
    return res.data;
  },

  checkWishlist: async (appId) => {
    const res = await api.get(`/wishlist/check/${appId}`);
    return res.data;
  }
};
