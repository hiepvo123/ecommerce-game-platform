import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { ordersService } from '../services/ordersService';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ordersService.getOrders();
        const list = res?.data?.orders || res?.orders || [];
        setOrders(list);
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

  const normalizeItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return [];
      }
    }
    return [];
  };

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>My Orders</h1>

          {loading && <div style={styles.message}>Loading orders...</div>}
          {error && <div style={styles.error}>{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div style={styles.message}>No orders yet.</div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div style={styles.list}>
              {orders.map((order) => (
                (() => {
                  const orderItems = normalizeItems(order.items);
                  const maxThumbs = 4;
                  const thumbs = orderItems.slice(0, maxThumbs);
                  const extraCount = orderItems.length - thumbs.length;
                  return (
                <div
                  key={order.id}
                  style={styles.orderRow}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div style={styles.orderLeft}>
                    <div style={styles.orderId}>Order #{order.id}</div>
                    <div style={styles.orderMeta}>
                      <span>Status: {order.order_status}</span>
                    </div>
                    {thumbs.length > 0 && (
                      <div style={styles.thumbsRow}>
                        {thumbs.map((item, index) => (
                          <img
                            key={`${order.id}-${item.app_id || index}`}
                            src={item.header_image || '/placeholder-game.jpg'}
                            alt={item.name || 'Game'}
                            style={styles.thumb}
                            onError={(e) => {
                              e.target.src = '/placeholder-game.jpg';
                            }}
                          />
                        ))}
                        {extraCount > 0 && (
                          <div style={styles.thumbMore}>+{extraCount}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={styles.orderRight}>
                    <div style={styles.orderTotal}>{formatPrice(order.total_price)}</div>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    margin: 0,
    marginBottom: '16px',
  },
  message: {
    padding: '12px',
    color: '#4b5563',
  },
  error: {
    padding: '12px',
    color: '#dc2626',
    background: '#fee2e2',
    borderRadius: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  orderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderId: {
    fontWeight: 700,
    color: '#111827',
  },
  orderMeta: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  thumbsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  thumb: {
    width: '44px',
    height: '32px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    background: '#f3f4f6',
  },
  thumbMore: {
    width: '44px',
    height: '32px',
    borderRadius: '6px',
    border: '1px dashed #d1d5db',
    color: '#6b7280',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  },
  orderRight: {
    fontWeight: 700,
    color: '#111827',
  },
  orderTotal: {
    fontSize: '1rem',
  },
};

export default Orders;

