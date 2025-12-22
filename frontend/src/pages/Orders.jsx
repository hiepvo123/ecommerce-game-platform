import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { ordersService } from '../services/ordersService';
import { useNavigate } from 'react-router-dom';
import '../styles/Orders.css';

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

  const getStatusClass = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('paid')) return 'orders-status paid';
    if (normalized.includes('pending')) return 'orders-status pending';
    if (normalized.includes('cancel')) return 'orders-status cancelled';
    return 'orders-status';
  };

  return (
    <>
      <Navbar />
      <main className="orders-page">
        <div className="orders-shell">
          <div className="orders-card">
            <div className="orders-header">
              <div>
                <h1 className="orders-title">My Orders</h1>
                <p className="orders-subtitle">Track your purchases and revisit favorite games.</p>
              </div>
              <div className="orders-accent" aria-hidden="true" />
            </div>

            {loading && <div className="orders-message">Loading orders...</div>}
            {error && <div className="orders-error">{error}</div>}

            {!loading && !error && orders.length === 0 && (
              <div className="orders-message">No orders yet.</div>
            )}

            {!loading && !error && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order, index) => (
                  (() => {
                    const orderItems = normalizeItems(order.items);
                    const maxThumbs = 4;
                    const thumbs = orderItems.slice(0, maxThumbs);
                    const extraCount = orderItems.length - thumbs.length;
                    const statusText = order.order_status || 'unknown';
                    return (
                      <div
                        key={order.id}
                        className="orders-row"
                        style={{ '--delay': `${index * 90}ms` }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(`/orders/${order.id}`);
                          }
                        }}
                      >
                        <div className="orders-left">
                          <div className="orders-id">Order #{order.id}</div>
                          <div className="orders-meta">
                            <span className={getStatusClass(statusText)}>{statusText}</span>
                          </div>
                          {thumbs.length > 0 && (
                            <div className="orders-thumbs">
                              {thumbs.map((item, thumbIndex) => (
                                <img
                                  key={`${order.id}-${item.app_id || thumbIndex}`}
                                  src={item.header_image || '/placeholder-game.jpg'}
                                  alt={item.name || 'Game'}
                                  className="orders-thumb"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-game.jpg';
                                  }}
                                />
                              ))}
                              {extraCount > 0 && (
                                <div className="orders-thumb-more">+{extraCount}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="orders-right">
                          <div className="orders-total">{formatPrice(order.total_price)}</div>
                          <div className="orders-cta">View details -&gt;</div>
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Orders;

