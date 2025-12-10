import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (appId) => {
    const response = await api.post('/wishlist', { appId });
    return response.data;
  },

  removeFromWishlist: async (appId) => {
    const response = await api.delete(`/wishlist/${appId}`);
    return response.data;
  },

  checkWishlist: async (appId) => {
    const response = await api.get(`/wishlist/check/${appId}`);
    return response.data;
  },
};
