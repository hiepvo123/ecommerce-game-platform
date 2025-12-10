import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyOTP: async (otpData) => {
    const response = await api.post('/auth/verify', otpData);
    return response.data;
  },

  resendOTP: async () => {
    const response = await api.post('/auth/resend-otp');
    return response.data;
  },
};
