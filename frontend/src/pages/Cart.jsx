import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

const Cart = () => {
  const { cart, loading, removeFromCart } = useCart();
  const navigate = useNavigate();

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
      <main className="cart-page">
        <div className="cart-shell">
          <div className="cart-header">
            <div>
              <h1 className="cart-title">Shopping Cart</h1>
              <p className="cart-subtitle">Curate your library before checkout.</p>
            </div>
            <div className="cart-accent" aria-hidden="true" />
          </div>

          {loading ? (
            <div className="cart-message">Loading cart...</div>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-text">Your cart is empty</p>
              <button className="cart-browse" onClick={() => navigate('/')}>
                Browse Games
              </button>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                <div className="cart-selectall">
                  <label className="cart-checkbox">
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
                  <span className="cart-selectall-meta">
                    {selectedCount}/{items.length} selected
                  </span>
                </div>

                {items.map((item) => (
                  <div key={item.app_id} className="cart-item">
                    <label className="cart-item-check">
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
                    <button
                      className="cart-thumb"
                      type="button"
                      onClick={() => navigate(`/game/${item.app_id}`)}
                    >
                      <img
                        src={item.header_image || '/placeholder-game.jpg'}
                        alt={item.name}
                        className="cart-thumb-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-game.jpg';
                        }}
                      />
                    </button>
                    <div className="cart-info">
                      <button
                        className="cart-name"
                        type="button"
                        onClick={() => navigate(`/game/${item.app_id}`)}
                      >
                        {item.name}
                      </button>
                      <div className="cart-price">
                        {item.discount_percent > 0 && (
                          <>
                            <span className="cart-price-original">
                              ${parseFloat(
                                item.price_org ||
                                  item.price_final / (1 - item.discount_percent / 100)
                              ).toFixed(2)}
                            </span>
                            <span className="cart-discount">-{item.discount_percent}%</span>
                          </>
                        )}
                        <span className="cart-price-final">
                          {formatPrice(item.price_final)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => handleRemove(item.app_id)}
                      title="Remove from cart"
                      type="button"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-card">
                  <h2 className="cart-summary-title">Order Summary</h2>
                  <div className="cart-summary-row">
                    <span>Items ({selectedCount}/{items.length}):</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="cart-coupon">
                    <label className="cart-coupon-label">Coupon code</label>
                    <input
                      className="cart-coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon (optional)"
                    />
                  </div>

                  <div className="cart-divider"></div>
                  <div className="cart-total">
                    <span className="cart-total-label">Total:</span>
                    <span className="cart-total-price">{formatPrice(selectedTotal)}</span>
                  </div>
                  <button
                    className="cart-checkout"
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
                    <div className="cart-selection-note">
                      Select at least one game to checkout.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Cart;
