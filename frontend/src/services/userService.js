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
    const response = await api.delete(`/user/billing-addresses/${id}`);
    return response.data;
  },
};
