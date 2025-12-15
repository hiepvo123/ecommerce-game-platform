import api from './api';

export const adminService = {
  login: async (credentials) => {
    const response = await api.post('/admin/login', credentials);
    return response.data;
  },

  // Get dashboard statistics (uses session-based auth)
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    // Trả về { orders: number, users: number, games: number }
    return response.data; 
  },

  // 🔥 [THÊM] Hàm mới: Lấy danh sách đơn hàng gần đây
  getRecentOrders: async () => {
    const response = await api.get('/admin/recent-orders');
    return response.data; // { success, data: [...] }
  },

};
