import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';
import { userService } from '../services/userService';
import { paymentService } from '../services/paymentService';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkout } = useCart();

  const cartSnapshot = location.state?.cart || {};
  const initialItems = cartSnapshot.items || [];
  const initialTotal = cartSnapshot.total_price || 0;
  const initialCoupon = location.state?.couponCode || '';
  const selectedAppIds = location.state?.selectedAppIds || [];

  const [items] = useState(initialItems);
  const [subtotal] = useState(initialTotal);
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [billingAddressId, setBillingAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  
  const couponValidationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!items.length) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Fetch billing addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const response = await userService.getBillingAddresses();
        const addresses = response.data?.addresses || response.addresses || [];
        setBillingAddresses(addresses);
      } catch (err) {
        console.error('Failed to load billing addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  // Validate coupon when code changes (debounced)
  useEffect(() => {
    if (couponValidationTimeoutRef.current) {
      clearTimeout(couponValidationTimeoutRef.current);
    }

    if (!couponCode.trim()) {
      setCouponDiscount(0);
      setCouponError('');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    couponValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await cartService.validateCoupon(couponCode.trim(), subtotal);
        const validation = response.data || response;
        
        if (validation.valid) {
          setCouponDiscount(Number(validation.discount) || 0);
          setCouponError('');
        } else {
          setCouponDiscount(0);
          setCouponError(validation.message || 'Invalid coupon');
        }
      } catch (err) {
        setCouponDiscount(0);
        setCouponError('Failed to validate coupon');
      } finally {
        setValidatingCoupon(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (couponValidationTimeoutRef.current) {
        clearTimeout(couponValidationTimeoutRef.current);
      }
    };
  }, [couponCode, subtotal]);

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '$0.00';
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (!confirmChecked) {
      setMessage('Please confirm the order details.');
      return;
    }
    if (!paymentMethod) {
      setMessage('Please choose a payment method.');
      return;
    }

    try {
      setPlacing(true);
      setMessage('');

      // 1) Create order (pending)
      const appIdsForCheckout = selectedAppIds.length
        ? selectedAppIds
        : items.map((item) => item.app_id);
      const orderResponse = await checkout({
        couponCode: couponCode.trim() || null,
        billingAddressId: billingAddressId || null,
        appIds: appIdsForCheckout,
      });
      const createdOrder =
        orderResponse?.data?.order ||
        orderResponse?.order ||
        orderResponse;

      if (!createdOrder?.id) {
        throw new Error('Order not created');
      }

      setPlacedOrder(createdOrder);

      // 2) Create payment for the order
      const paymentResponse = await paymentService.createPayment({
        orderId: createdOrder.id,
        paymentMethod,
      });
      const payment =
        paymentResponse?.data?.payment ||
        paymentResponse?.payment ||
        paymentResponse;

      const paymentStatus = payment?.payment_status || 'initiated';
      setMessage(`Order placed. Payment ${paymentStatus}.`);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to place order';
      setMessage(msg);
    } finally {
      setPlacing(false);
    }
  };

  const orderForDisplay = placedOrder || null;
  // Use real-time discount if order not placed yet, otherwise use order discount
  const currentDiscount = orderForDisplay 
    ? Number(orderForDisplay.discount_order) || 0
    : couponDiscount;
  const hasDiscount = currentDiscount > 0;
  const subtotalDisplay = Number(subtotal);
  const totalPrice = subtotalDisplay - currentDiscount;

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Checkout</h1>
            {orderForDisplay && (
              <span style={styles.orderId}>Order #{orderForDisplay.id} — {orderForDisplay.order_status}</span>
            )}
          </div>

          <div style={styles.grid}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Order Items</h2>
              <div style={styles.itemsList}>
                {(orderForDisplay?.items || items).map((item) => (
                  <div key={item.app_id} style={styles.itemRow}>
                    <div style={styles.itemLeft}>
                      <div style={styles.itemImageWrapper}>
                        <img
                          src={item.header_image || '/placeholder-game.jpg'}
                          alt={item.name}
                          style={styles.itemImage}
                          onError={(e) => {
                            e.target.src = '/placeholder-game.jpg';
                          }}
                        />
                      </div>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemName}>{item.name}</div>
                      </div>
                    </div>
                    <div style={styles.itemPrice}>
                      {formatPrice(item.price_final || item.unit_price_paid)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Details</h2>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Coupon</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon (optional)"
                  style={{
                    ...styles.input,
                    borderColor: couponError ? '#dc2626' : (validatingCoupon ? '#3b82f6' : '#d1d5db'),
                  }}
                />
                {validatingCoupon && (
                  <div style={{ ...styles.helper, color: '#3b82f6' }}>Validating...</div>
                )}
                {couponError && (
                  <div style={{ ...styles.helper, color: '#dc2626' }}>{couponError}</div>
                )}
                {hasDiscount && !couponError && !validatingCoupon && (
                  <div style={{ ...styles.helper, color: '#166534' }}>
                    Coupon applied! Discount: {formatPrice(couponDiscount)}
                  </div>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Billing Address</label>
                {loadingAddresses ? (
                  <div style={styles.helper}>Loading addresses...</div>
                ) : billingAddresses.length > 0 ? (
                  <select
                    value={billingAddressId}
                    onChange={(e) => setBillingAddressId(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Select billing address (optional)</option>
                    {billingAddresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.full_name} - {addr.line1}, {addr.city}, {addr.country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <div style={styles.helper}>No saved addresses. You can add one in your profile.</div>
                    <input
                      type="text"
                      value={billingAddressId}
                      onChange={(e) => setBillingAddressId(e.target.value)}
                      placeholder="Billing address ID (optional)"
                      style={styles.input}
                    />
                  </>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Payment Method</label>
                <div style={styles.radioRow}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="payment"
                      value="visa"
                      checked={paymentMethod === 'visa'}
                      onChange={() => setPaymentMethod('visa')}
                    />
                    <span>Visa</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="payment"
                      value="qr"
                      checked={paymentMethod === 'qr'}
                      onChange={() => setPaymentMethod('qr')}
                    />
                    <span>QR Code</span>
                  </label>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Order Summary</label>
                <div style={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalDisplay)}</span>
                </div>
                {hasDiscount && (
                  <div style={styles.summaryRow}>
                    <span>Discount ({orderForDisplay?.discount_code || couponCode || 'coupon'})</span>
                    <span style={styles.discountAmount}>- {formatPrice(currentDiscount)}</span>
                  </div>
                )}
                <div style={styles.divider} />
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalValue}>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                  />
                  <span>I confirm my order details are correct.</span>
                </label>
              </div>

              <button
                style={styles.primaryButton}
                disabled={placing || !items.length}
                onClick={handlePlaceOrder}
              >
                {placing ? 'Placing order...' : 'Place Order'}
              </button>

              {message && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    background:
                      message.toLowerCase().includes('fail') ||
                      message.toLowerCase().includes('error') ||
                      message.toLowerCase().includes('invalid') ||
                      message.toLowerCase().includes('empty')
                        ? '#fee2e2'
                        : '#dcfce7',
                    color:
                      message.toLowerCase().includes('fail') ||
                      message.toLowerCase().includes('error') ||
                      message.toLowerCase().includes('invalid') ||
                      message.toLowerCase().includes('empty')
                        ? '#dc2626'
                        : '#166534',
                    fontWeight: 600,
                  }}
                >
                  {message}
                </div>
              )}
            </section>
          </div>

          {orderForDisplay && (
            <div style={styles.actions}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate('/orders')}
              >
                View Orders
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate('/')}
              >
                Back to Store
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '10px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    margin: 0,
  },
  orderId: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: '16px',
  },
  section: {
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: '10px',
    color: '#0f172a',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  itemImageWrapper: {
    width: '72px',
    height: '54px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#f3f4f6',
    flexShrink: 0,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  itemName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#111827',
  },
  itemPrice: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#111827',
  },
  fieldGroup: {
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.9rem',
    color: '#374151',
    fontWeight: 600,
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
  },
  helper: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  radioRow: {
    display: 'flex',
    gap: '14px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.95rem',
    color: '#111827',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    color: '#4b5563',
    marginBottom: '6px',
  },
  divider: {
    height: 1,
    background: '#e5e7eb',
    margin: '10px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  totalLabel: {
    fontSize: '1.05rem',
    fontWeight: 600,
  },
  totalValue: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#111827',
  },
  discountAmount: {
    color: '#dc2626',
    fontWeight: 600,
  },
  actions: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 600,
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    color: '#111827',
  },
};

export default Checkout;
