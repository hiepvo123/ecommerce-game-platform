import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, loading, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Handle different cart data structures from API
  const cartData = cart?.cart || cart || {};
  const items = cartData?.items || [];
  const [couponCode, setCouponCode] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState(new Set());
  const [hasUserSelection, setHasUserSelection] = useState(false);

  useEffect(() => {
    setSelectedAppIds((prev) => {
      const next = new Set();
      if (!hasUserSelection) {
        items.forEach((item) => next.add(item.app_id));
        return next;
      }
      items.forEach((item) => {
        if (prev.has(item.app_id)) {
          next.add(item.app_id);
        }
      });
      return next;
    });
  }, [items, hasUserSelection]);

  const handleRemove = async (appId) => {
    try {
      await removeFromCart(appId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const selectedItems = items.filter((item) => selectedAppIds.has(item.app_id));
  const selectedTotal = selectedItems.reduce((sum, item) => {
    const price = Number(item.price_final);
    return sum + (Number.isNaN(price) ? 0 : price);
  }, 0);
  const selectedCount = selectedItems.length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <h1 style={styles.title}>Shopping Cart</h1>

        {loading ? (
          <div style={styles.message}>Loading cart...</div>
        ) : items.length === 0 ? (
          <div style={styles.emptyCart}>
            <p style={styles.emptyText}>Your cart is empty</p>
            <button
              className="browse-button"
              style={styles.browseButton}
              onClick={() => navigate('/')}
            >
              Browse Games
            </button>
          </div>
        ) : (
          <div style={styles.cartContent}>
            <div style={styles.itemsSection}>
              <div style={styles.selectAllRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      setHasUserSelection(true);
                      setSelectedAppIds(
                        e.target.checked
                          ? new Set(items.map((item) => item.app_id))
                          : new Set()
                      );
                    }}
                  />
                  <span>Select all</span>
                </label>
                <span style={styles.selectAllMeta}>
                  {selectedCount}/{items.length} selected
                </span>
              </div>
              {items.map((item) => (
                <div key={item.app_id} style={styles.cartItem}>
                  <label style={styles.itemCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedAppIds.has(item.app_id)}
                      onChange={() => {
                        setHasUserSelection(true);
                        setSelectedAppIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.app_id)) {
                            next.delete(item.app_id);
                          } else {
                            next.add(item.app_id);
                          }
                          return next;
                        });
                      }}
                    />
                  </label>
                  <div
                    style={styles.gameImage}
                    onClick={() => navigate(`/game/${item.app_id}`)}
                  >
                    <img
                      src={item.header_image || '/placeholder-game.jpg'}
                      alt={item.name}
                      style={styles.image}
                      onError={(e) => {
                        e.target.src = '/placeholder-game.jpg';
                      }}
                    />
                  </div>
                  <div style={styles.gameInfo}>
                    <h3
                      className="game-name"
                      style={styles.gameName}
                      onClick={() => navigate(`/game/${item.app_id}`)}
                    >
                      {item.name}
                    </h3>
                    <div style={styles.gamePrice}>
                      {item.discount_percent > 0 && (
                        <>
                          <span style={styles.originalPrice}>
                            ${parseFloat(item.price_org || item.price_final / (1 - item.discount_percent / 100)).toFixed(2)}
                          </span>
                          <span style={styles.discount}>-{item.discount_percent}%</span>
                        </>
                      )}
                      <span style={styles.finalPrice}>
                        {formatPrice(item.price_final)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="remove-button"
                    style={styles.removeButton}
                    onClick={() => handleRemove(item.app_id)}
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.summarySection}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>Order Summary</h2>
                <div style={styles.summaryRow}>
                  <span>Items ({selectedCount}/{items.length}):</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>
                <div style={{ margin: '16px 0' }}>
                  <label style={{ fontSize: '0.9rem', color: '#555' }}>Coupon code</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon (optional)"
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={styles.summaryDivider}></div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total:</span>
                  <span style={styles.totalPrice}>{formatPrice(selectedTotal)}</span>
                </div>
                <button
                  className="checkout-button"
                  style={styles.checkoutButton}
                  disabled={selectedCount === 0}
                  onClick={() => {
                    navigate('/checkout', {
                      state: {
                        cart: { items: selectedItems, total_price: selectedTotal },
                        couponCode: couponCode.trim() || '',
                        selectedAppIds: selectedItems.map((item) => item.app_id),
                      },
                    });
                  }}
                >
                  Proceed to Checkout
                </button>
                {items.length > 0 && selectedCount === 0 && (
                  <div style={styles.selectionNote}>Select at least one game to checkout.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#1a1a1a',
  },
  message: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
    fontSize: '1.1rem',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '48px',
  },
  emptyText: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '24px',
  },
  browseButton: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cartContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '24px',
  },
  itemsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  selectAllRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  selectAllMeta: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  cartItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  itemCheckbox: {
    display: 'flex',
    alignItems: 'center',
  },
  gameImage: {
    width: '120px',
    height: '90px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#f0f0f0',
    cursor: 'pointer',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  gameInfo: {
    flex: 1,
    minWidth: 0,
  },
  gameName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  gameNameHover: {
    color: '#3b82f6',
  },
  gamePrice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  originalPrice: {
    fontSize: '0.9rem',
    color: '#999',
    textDecoration: 'line-through',
  },
  discount: {
    fontSize: '0.85rem',
    background: '#10b981',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  finalPrice: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  removeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#999',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  summarySection: {
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '0.95rem',
    color: '#666',
  },
  selectionNote: {
    marginTop: '10px',
    fontSize: '0.85rem',
    color: '#b45309',
    textAlign: 'center',
  },
  summaryDivider: {
    height: '1px',
    background: '#e5e5e5',
    margin: '16px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  totalLabel: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalPrice: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  checkoutButton: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '700',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  checkoutButtonHover: {
    background: '#2563eb',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    color: '#111827',
  },
};

export default Cart;
