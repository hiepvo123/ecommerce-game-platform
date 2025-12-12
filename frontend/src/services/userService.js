// frontend/src/services/userService.js
import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  getBillingAddresses: async () => {
    const response = await api.get('/user/billing-addresses');
    return response.data;
  },

  getBillingAddressById: async (id) => {
    const response = await api.get(`/user/billing-addresses/${id}`);
    return response.data;
  },

  createBillingAddress: async (addressData) => {
    const response = await api.post('/user/billing-addresses', addressData);
    return response.data;
  },

  updateBillingAddress: async (id, addressData) => {
    const response = await api.put(`/user/billing-addresses/${id}`, addressData);
    return response.data;
  },

  deleteBillingAddress: async (id) => {
    const response = await api.delete(`/users/billing-addresses/${id}`);
    return response.data;
  },

  getWishlist: async () => {
    const response = await api.get('/wishlist');  // -> GET /api/wishlist
    return response.data;
  },

  addToWishlist: async (appId) => {
    const response = await api.post('/wishlist', { appId }); // -> POST /api/wishlist { appId }
    return response.data;
  },

  removeFromWishlist: async (appId) => {
    const response = await api.delete(`/wishlist/${appId}`); // -> DELETE /api/wishlist/:appId
    return response.data;
  },
};
