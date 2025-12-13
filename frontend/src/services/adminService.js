import api from './api';

export const adminService = {
  login: async (credentials) => {
    const response = await api.post('/admin/login', credentials);
    return response.data;
  },

// 🔥 [CẬP NHẬT] Hàm mới để lấy số liệu thống kê
  getDashboardStats: async () => {
  const token = localStorage.getItem('adminToken');

  const response = await api.get('/admin/stats', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
    // Trả về { orders: number, users: number, games: number }
    return response.data; 
  },
};
