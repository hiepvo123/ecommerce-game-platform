
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService'; // Import service
import { useNavigate } from 'react-router-dom';

// 🔥 [THÊM] Component ActionBox cho Quick Actions
const ActionBox = ({ title, actions, navigate }) => (
    <div style={styles.actionBox}>
        <h3 style={styles.actionTitle}>{title}</h3>
        <div style={styles.actionGroup}>
            {actions.map((action, index) => (
                <button 
                    key={index} 
                    style={styles.actionButton} 
                    onClick={() => navigate(action.path)}
                >
                    <span style={{ marginRight: '8px' }}>{action.icon}</span> 
                    {action.label}
                </button>
            ))}
        </div>
    </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  // Initialize with a neutral placeholder value
  const [stats, setStats] = useState({ orders: ' _ ', users: ' _ ', games: ' _ ' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch recent orders on component mount
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoadingOrders(true);
        const response = await adminService.getRecentOrders();
        setRecentOrders(response.data);
      } catch (err) {
        console.error('Failed to load recent orders', err);
        setRecentOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchRecentOrders();
  }, []);

  // Fetch recent reviews on component mount
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await adminService.getRecentReviews();
        setRecentReviews(response.data || []);
      } catch (err) {
        console.error('Failed to load recent reviews', err);
        setRecentReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchRecentReviews();
  }, []);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getDashboardStats();
        setStats(response.data);

      }catch (err) {
        console.error('Failed to load dashboard stats.', err);
        // Xử lý lỗi từ backend (ví dụ: lỗi 403 do chưa đăng nhập admin)
        const errorMessage = err.response?.data?.error?.message || 'Failed to load stats.';
        setError(errorMessage);
        setStats({ orders: 'Error', users: 'Error', games: 'Error' });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  // 🔥 [THÊM] ĐỊNH NGHĨA HÀM getDisplayValue
  // Hàm này quyết định cách hiển thị: Loading, Error, hoặc giá trị số đã định dạng
  const getDisplayValue = (value) => {
    if (loading) return 'Loading...';
    // Chỉ định dạng số nếu nó là một số
    return typeof value === 'number' ? value.toLocaleString('en-US') : value;
  };

  const getOrderStatusColor = (status) => {
    const statusUpper = String(status).toUpperCase();
    const statusColors = {
      PENDING: '#f59e0b', // yellow
      PAID: '#10b981', // green
      COMPLETED: '#10b981', // green
      CANCELED: '#ef4444', // red
      REFUNDED: '#8b5cf6', // purple
      FAILED: '#ef4444', // red
    };
    return statusColors[statusUpper] || '#6b7280'; // gray default
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, admin. Manage the store here.</p>
          <div style={styles.grid}>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Orders</div>
              <div style={styles.tileValue}>{getDisplayValue(stats.orders)}</div>
            </div>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Users</div>
              <div style={styles.tileValue}>{getDisplayValue(stats.users)}</div>
            </div>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Games</div>
              <div style={styles.tileValue}>{getDisplayValue(stats.games)}</div>
            </div>
          </div>
        </div>

        
        {/* 🔥 [THÊM] Phần Quick Actions */}
        <div style={styles.actionGrid}>
                    <ActionBox
                        title="📋 Order Control"
                        actions={[
                            { icon: "📦", label: "View All Orders", path: "/admin/orders"},
                            { icon: "🔄", label: "Pending Payments", path: "/admin/payments/pending"},
                        ]}
                        navigate={navigate}
                    />
                    <ActionBox
                        title="🧑‍💻 User Control"
                        actions={[
                            { icon: "👥", label: "Manage User Accounts", path: "/admin/users" },
                            { icon: "💬", label: "Manage Reviews", path: "/admin/reviews" },
                        ]}
                        navigate={navigate}
                    />
                    <ActionBox
                        title="🎮 Game Management"
                        actions={[
                            { icon: "✨", label: "Add New Game"  , path: "/admin/games/new" },
                            { icon: "📝", label: "Manage Game List", path: "/admin/games" },
                        ]}
                        navigate={navigate}
                    />
                </div>

        {/* 🔥 [THÊM] Phần Recent Orders */}
        <div style={styles.recentCard}>
  <h3 style={styles.actionTitle}>🕒 Recent Orders</h3>

  {loadingOrders ? (
    <p style={styles.placeholder}>Loading recent orders...</p>
  ) : recentOrders.length === 0 ? (
    <p style={styles.placeholder}>No recent orders found.</p>
  ) : (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style ={styles.th}>ID</th>
          <th style ={styles.th}>User</th>
          <th style ={styles.th}>Total</th>
          <th style ={styles.th}>Status</th>
          <th style ={styles.th}>Date</th>
        </tr>
      </thead>
      <tbody>
        {recentOrders.map((order) => (
          <tr key={order.id}>
            <td style ={styles.td}>#{order.id}</td>
            <td>{order.user_email}</td>
            <td>${Number(order.total_price).toFixed(2)}</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getOrderStatusColor(order.order_status),
                      }}>
                        {order.order_status}
                      </span>
                    </td>
            <td>{new Date(order.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

        {/* 🔥 [THÊM] Phần Recent Reviews */}
        <div style={styles.recentCard}>
          <h3 style={styles.actionTitle}>📝 Recent Reviews</h3>

          {loadingReviews ? (
            <p style={styles.placeholder}>Loading recent reviews...</p>
          ) : recentReviews.length === 0 ? (
            <p style={styles.placeholder}>No recent reviews found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Game</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Verdict</th>
                  <th style={styles.th}>Review</th>
                  <th style={styles.th}>Reviewed At</th>
                </tr>
              </thead>
              <tbody>
                {recentReviews.map((rev) => (
                  <tr key={rev.id}>
                    <td style={styles.td}>{rev.game_name || `#${rev.app_id}`}</td>
                    <td style={styles.td}>{rev.username || rev.email || `User #${rev.user_id}`}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: rev.is_recommended ? '#10b981' : '#ef4444',
                        }}
                      >
                        {rev.is_recommended ? 'Recommended' : 'Not Recommended'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {rev.review_text && rev.review_text.length > 80
                        ? `${rev.review_text.slice(0, 80)}…`
                        : rev.review_text || ' _ '}
                    </td>
                    <td style={styles.td}>
                      {rev.review_at ? new Date(rev.review_at).toLocaleDateString() : ' _ '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </>
  );
};

export default AdminDashboard;

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    padding: '24px',
    fontFamily: "'Manrope', sans-serif",
  },
  card: {
    background: '#f2f0e9',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 18px 40px rgba(33, 81, 34, 0.12)',
  },

  // 🔥 [THÊM] Styles cho Quick Actions
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '18px',
  },
  actionBox: {
    background: '#ffffff',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 10px 24px rgba(33, 81, 34, 0.08)',
  },
  actionTitle: {
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#215122',
            borderBottom: '1px dashed rgba(33, 81, 34, 0.25)',
            paddingBottom: '10px',
            fontFamily: "'Fraunces', serif",
        },
        actionGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        actionButton: {
            padding: '10px 15px',
            borderRadius: '12px',
            border: '1px solid rgba(33, 81, 34, 0.2)',
            background: '#fff',
            color: '#1c231f',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            textAlign: 'left',
            boxShadow: '0 6px 14px rgba(33, 81, 34, 0.08)',
        },

  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  subtitle: {
    margin: '6px 0 16px',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  tile: {
    border: '1px solid rgba(33, 81, 34, 0.12)',
    borderRadius: '14px',
    padding: '12px',
    background: '#ffffff',
    boxShadow: '0 8px 18px rgba(33, 81, 34, 0.08)',
  },
  tileLabel: {
    color: 'rgba(33, 81, 34, 0.6)',
    fontSize: '13px',
    marginBottom: '6px',
  },
  tileValue: {
    fontWeight: 700,
    fontSize: '18px',
    color: '#1c231f',
    fontFamily: "'Fraunces', serif",
  },

  recentCard: {
  marginTop: '24px',
  background: '#ffffff',
  border: '1px solid rgba(33, 81, 34, 0.12)',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 10px 24px rgba(33, 81, 34, 0.08)',
},

table: {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontSize: '14px',
},

statusBadge: {
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  display: 'inline-block',
},

placeholder: {
  color: 'rgba(33, 81, 34, 0.6)',
  fontStyle: 'italic',
},

th: {
  textAlign: 'left',
  padding: '12px 10px',
  color: 'rgba(33, 81, 34, 0.7)',
  fontWeight: 600,
  fontSize: '13px',
  fontFamily: "'Fraunces', serif",
},

td: {
  padding: '12px 10px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  borderBottom: '1px solid rgba(33, 81, 34, 0.12)',
},

};
