import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  getCartCount: async () => {
    const response = await api.get('/cart/count');
    return response.data;
  },

  addToCart: async (appId) => {
    const response = await api.post('/cart/items', { appId });
    return response.data;
  },

  removeFromCart: async (appId) => {
    const response = await api.delete(`/cart/items/${appId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};
