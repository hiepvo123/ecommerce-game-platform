import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';

const OrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getAllOrders();
        setOrders(response.data?.orders || []);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load orders';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    const statusUpper = String(status).toUpperCase();
    const statusColors = {
      PENDING: '#f59e0b', // yellow
      PAID: '#10b981', // green
      COMPLETED: '#10b981', // green
      CANCELED: '#ef4444', // red
      REFUNDED: '#8b5cf6', // purple
      FAILED: '#ef4444', // red
    };
    return statusColors[statusUpper] || statusColors[String(status).toLowerCase()] || '#6b7280';
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Orders Management</h1>
              <p style={styles.subtitle}>View and manage all orders</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div style={styles.message}>Loading orders...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : orders.length === 0 ? (
            <div style={styles.message}>No orders found.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={styles.td}>#{order.id}</td>
                      <td style={styles.td}>{order.user_username || ' _ '}</td>
                      <td style={styles.td}>{order.user_email || ' _ '}</td>
                      <td style={styles.td}>{formatPrice(order.total_price)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(order.order_status),
                          }}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    padding: '24px',
    fontFamily: "'Manrope', sans-serif",
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 18px 40px rgba(33, 81, 34, 0.12)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '14px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '999px',
    border: '1px solid rgba(33, 81, 34, 0.25)',
    background: '#fff',
    color: '#215122',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 8px 16px rgba(33, 81, 34, 0.12)',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px dashed rgba(33, 81, 34, 0.25)',
    fontWeight: 700,
    color: '#215122',
    fontSize: '14px',
    fontFamily: "'Fraunces', serif",
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid rgba(33, 81, 34, 0.12)',
    fontSize: '14px',
    color: '#324035',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize',
    display: 'inline-block',
  },
  viewButton: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(33, 81, 34, 0.3)',
    background: '#fff',
    color: '#215122',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12px',
    boxShadow: '0 6px 12px rgba(33, 81, 34, 0.12)',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: 'rgba(33, 81, 34, 0.7)',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#8b1d22',
    background: 'rgba(224, 46, 53, 0.12)',
    borderRadius: '12px',
    border: '1px solid rgba(224, 46, 53, 0.3)',
  },
};

export default OrdersManagement;

