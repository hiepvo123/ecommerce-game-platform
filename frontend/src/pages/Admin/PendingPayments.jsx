import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';

const PendingPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getAllPayments();
        setPayments(response.data?.payments || []);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load payments';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      setUpdating({ ...updating, [paymentId]: true });
      await adminService.updatePaymentStatus(paymentId, newStatus);
      
      // Refresh payments list
      const response = await adminService.getAllPayments();
      setPayments(response.data?.payments || []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to update payment status';
      alert(msg);
    } finally {
      setUpdating({ ...updating, [paymentId]: false });
    }
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      initiated: '#f59e0b', // yellow
      authorized: '#3b82f6', // blue
      captured: '#10b981', // green
      paid: '#10b981', // green
      failed: '#ef4444', // red
      canceled: '#ef4444', // red
      refunded: '#8b5cf6', // purple
    };
    return statusColors[status] || '#6b7280'; // gray default
  };

  const hexToRgba = (hex, alpha) => {
    if (!hex || typeof hex !== 'string') return `rgba(33, 81, 34, ${alpha})`;
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return `rgba(33, 81, 34, ${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getOrderStatusColor = (status) => {
    const statusColors = {
      pending: '#f59e0b', // yellow
      paid: '#10b981', // green
      canceled: '#ef4444', // red
      refunded: '#8b5cf6', // purple
      failed: '#ef4444', // red
    };
    return statusColors[status] || '#6b7280'; // gray default
  };

  const paymentStatusOptions = [
    { value: 'authorized', label: 'Authorized', color: '#10b981' },
    { value: 'captured', label: 'Captured', color: '#10b981' },
    { value: 'failed', label: 'Failed', color: '#ef4444' },
    { value: 'canceled', label: 'Canceled', color: '#ef4444' },
    { value: 'refunded', label: 'Refunded', color: '#8b5cf6' },
  ];

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
              <h1 style={styles.title}>Payments Management</h1>
              <p style={styles.subtitle}>View and manage all payment statuses</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div style={styles.message}>Loading payments...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : payments.length === 0 ? (
            <div style={styles.message}>No payments found.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Payment ID</th>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Payment Method</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Payment Status</th>
                    <th style={styles.th}>Order Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td style={styles.td}>#{payment.id}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.linkButton}
                          onClick={() => navigate(`/orders/${payment.order_id}`)}
                        >
                          #{payment.order_id}
                        </button>
                      </td>
                      <td style={styles.td}>{payment.user_username || ' _ '}</td>
                      <td style={styles.td}>{payment.user_email || ' _ '}</td>
                      <td style={styles.td}>{payment.payment_name || ' _ '}</td>
                      <td style={styles.td}>{formatPrice(payment.payment_price)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getPaymentStatusColor(payment.payment_status),
                          }}
                        >
                          {payment.payment_status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getOrderStatusColor(payment.order_status),
                          }}
                        >
                          {payment.order_status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(payment.payment_created).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <select
                          style={{
                            ...styles.select,
                            borderColor: getPaymentStatusColor(payment.payment_status),
                            color: getPaymentStatusColor(payment.payment_status),
                            backgroundColor: hexToRgba(
                              getPaymentStatusColor(payment.payment_status),
                              0.12
                            ),
                          }}
                          value={payment.payment_status}
                          onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                          disabled={updating[payment.id]}
                        >
                          <option value="initiated">Initiated</option>
                          {paymentStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {updating[payment.id] && (
                          <span style={styles.updating}>Updating...</span>
                        )}
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
  select: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(33, 81, 34, 0.3)',
    background: '#fff',
    color: '#215122',
    fontSize: '12px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  linkButton: {
    padding: 0,
    border: 'none',
    background: 'none',
    color: '#215122',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  updating: {
    fontSize: '11px',
    color: 'rgba(33, 81, 34, 0.7)',
    marginLeft: '8px',
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

export default PendingPayments;

