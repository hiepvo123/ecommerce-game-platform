
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
  // Khởi tạo state với giá trị mặc định '—'
  const [stats, setStats] = useState({ orders: '—', users: '—', games: '—' });
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

  return (
    <>
      <Navbar />
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
                ...(order.order_status === 'COMPLETED'
                  ? styles.statusCompleted
                  : styles.statusPending)
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
                          ...(rev.is_recommended ? styles.statusCompleted : styles.statusPending),
                        }}
                      >
                        {rev.is_recommended ? 'Recommended' : 'Not Recommended'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {rev.review_text && rev.review_text.length > 80
                        ? `${rev.review_text.slice(0, 80)}…`
                        : rev.review_text || '—'}
                    </td>
                    <td style={styles.td}>
                      {rev.review_at ? new Date(rev.review_at).toLocaleDateString() : '—'}
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
    background: '#f8f9fb',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
  },

  // 🔥 [THÊM] Styles cho Quick Actions
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  actionBox: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.04)',
  },
  actionTitle: {
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: '10px',
        },
        actionGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        actionButton: {
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            color: '#111827',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            textAlign: 'left',
            transition: 'background 0.2s',
        },

  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 16px',
    color: '#6b7280',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  tile: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '12px',
    background: '#f9fafb',
  },
  tileLabel: {
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '6px',
  },
  tileValue: {
    fontWeight: 700,
    fontSize: '18px',
    color: '#111827',
  },

  recentCard: {
  marginTop: '24px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '20px',
  boxShadow: '0 5px 15px rgba(0,0,0,0.04)',
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
},

statusCompleted: {
  background: '#dcfce7',
  color: '#166534',
},

statusPending: {
  background: '#fef3c7',
  color: '#92400e',
},

placeholder: {
  color: '#9ca3af',
  fontStyle: 'italic',
},

th: {
  textAlign: 'left',
  padding: '12px 10px',
  color: '#6b7280',
  fontWeight: 600,
  fontSize: '13px',
},

td: {
  padding: '12px 10px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
},

};
