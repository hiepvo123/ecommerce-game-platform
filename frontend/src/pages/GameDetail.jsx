import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { gameService } from '../services/gameService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const GameDetail = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRecommended, setReviewRecommended] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    const str = String(val).trim();
    if (!str) return '';
    return str.startsWith('$') ? str : `$${str}`;
  };

  const formatDate = (val) => {
    if (!val) return '';
    const str = String(val);
    if (str.includes(' ')) return str.split(' ')[0];
    if (str.includes('T')) return str.split('T')[0];
    return str.slice(0, 10);
  };

  const priceInfo = useMemo(() => {
    if (!game) return { hasDiscount: false, final: '', original: '', percent: 0 };
    const originalRaw = game.original_price ?? game.price_org ?? game.price ?? game.list_price;
    const finalRaw = game.final_price ?? game.price_final ?? game.discount_price ?? game.price_after_discount ?? game.price;

    const apiPercent = Number(game.discount_percent) > 0 ? Number(game.discount_percent) : 0;
    const computedPercent =
      originalRaw && finalRaw && Number(originalRaw) > 0
        ? Math.round(((Number(originalRaw) - Number(finalRaw)) / Number(originalRaw)) * 100)
        : 0;
    const discountPercent = apiPercent || computedPercent || 0;

    const hasDiscount =
      discountPercent > 0 ||
      (finalRaw !== undefined && originalRaw !== undefined && Number(finalRaw) < Number(originalRaw));

    return {
      hasDiscount: Boolean(hasDiscount),
      final: formatPrice(finalRaw ?? originalRaw),
      original: hasDiscount ? formatPrice(originalRaw) : '',
      percent: discountPercent,
    };
  }, [game]);

  useEffect(() => {
    let active = true;
    const fetchGame = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await gameService.getGameById(appId);
        const data = res?.data?.game || res?.game || res?.data || res;
        if (active) {
          setGame(data || null);
        }
      } catch (err) {
        if (!active) return;
        const message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Unable to load game details';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchGame();
    return () => {
      active = false;
    };
  }, [appId]);

  // Load reviews and the current user's review once game is loaded
  useEffect(() => {
    if (!game || !game.app_id) return;

    let cancelled = false;

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/games/${game.app_id}/reviews`, {
          params: { limit: 20, offset: 0, sortBy: 'id', order: 'DESC' },
        });
        const payload = res?.data;
        const list = payload?.data?.reviews || payload?.reviews || [];
        const stats = payload?.data?.stats || payload?.stats || null;
        if (!cancelled) {
          setReviews(Array.isArray(list) ? list : []);
          setReviewStats(stats);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Fetch game reviews error:', err);
        }
      }
    };

    const fetchMyReview = async () => {
      if (!isAuthenticated) {
        setMyReview(null);
        setReviewText('');
        setReviewRecommended(true);
        return;
      }
      try {
        const res = await api.get(`/games/${game.app_id}/review/me`);
        const payload = res?.data;
        const review = payload?.data?.review || payload?.review || null;
        if (!cancelled) {
          if (review) {
            setMyReview(review);
            setReviewText(review.review_text || '');
            setReviewRecommended(Boolean(review.is_recommended));
          } else {
            setMyReview(null);
            setReviewText('');
            setReviewRecommended(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response && err.response.status === 404) {
            setMyReview(null);
            setReviewText('');
            setReviewRecommended(true);
          } else {
            console.error('Fetch my review error:', err);
          }
        }
      }
    };

    fetchReviews();
    fetchMyReview();

    return () => {
      cancelled = true;
    };
  }, [game, isAuthenticated]);

  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text).replace(/[\[\]'"]/g, '').trim();
  };

  const toArrayNames = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => sanitizeText(v?.name || v)).filter(Boolean);
    const str = sanitizeText(val);
    if (str.includes(',')) return str.split(',').map((s) => s.trim()).filter(Boolean);
    return [str].filter(Boolean);
  };

  // Strip HTML tags to get plain text length (regex-based, safe for React)
  const stripHtml = (html) => {
    if (!html) return '';
    const str = String(html);
    // Remove HTML tags
    let text = str.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    return text.trim();
  };

  // Get plain text version of description for length calculation
  const getPlainTextLength = (text) => {
    if (!text) return 0;
    const plain = stripHtml(String(text));
    return plain.length;
  };

  const description =
    game?.about_the_game ||
    game?.detailed_description ||
    game?.short_description ||
    game?.description ||
    'No description available yet.';

  const supportedLangs = toArrayNames(game?.languages || game?.supported_languages);
  const genres = toArrayNames(game?.genres || game?.genres_json);
  const categories = toArrayNames(game?.categories || game?.categories_json);
  const publishers = toArrayNames(game?.publishers);
  const developers = toArrayNames(game?.developers);

  const platformLabels = [
    game?.platforms_windows ? 'Windows' : null,
    game?.platforms_mac ? 'Mac' : null,
    game?.platforms_linux ? 'Linux' : null,
  ].filter(Boolean);

  const buildSpecs = (prefix) => {
    if (!game) return [];
    const fields = [
      { key: `${prefix}_os`, label: 'OS' },
      { key: `${prefix}_processor`, label: 'Processor' },
      { key: `${prefix}_memory`, label: 'Memory' },
      { key: `${prefix}_graphics`, label: 'Graphics' },
      { key: `${prefix}_directx`, label: 'DirectX' },
      { key: `${prefix}_network`, label: 'Network' },
      { key: `${prefix}_storage`, label: 'Storage' },
    ];
    return fields
      .map((f) => ({ label: f.label, value: game[f.key] }))
      .filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
  };

  const minSpecs = buildSpecs('pc_min');
  const recSpecs = buildSpecs('pc_rec');

  const headerImage = game?.header_image || game?.image || game?.thumbnail || '';

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const isInWishlist = useMemo(() => {
    if (!game || !wishlist) return false;
    return wishlist.some(item => item.app_id === game.app_id || item.appId === game.app_id);
  }, [game, wishlist]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!game?.app_id) {
      setCartMessage('Error: Game information not available');
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }

    try {
      setCartMessage('');
      await addToCart(game.app_id);
      setCartMessage('Added to cart!');
      setTimeout(() => setCartMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to add to cart';
      setCartMessage(errorMsg);
      setTimeout(() => setCartMessage(''), 5000);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!game?.app_id) {
      return;
    }

    try {
      setWishlistMessage('');
      if (isInWishlist) {
        await removeFromWishlist(game.app_id);
        setWishlistMessage('Removed from wishlist');
      } else {
        await addToWishlist(game);
        setWishlistMessage('Added to wishlist!');
      }
      setTimeout(() => setWishlistMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to update wishlist';
      setWishlistMessage(errorMsg);
      setTimeout(() => setWishlistMessage(''), 5000);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!game?.app_id) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setReviewError('');
    setReviewSuccess('');

    try {
      setReviewLoading(true);
      const res = await api.post('/library/review', {
        appId: game.app_id,
        isRecommended: reviewRecommended,
        reviewText: reviewText.trim(),
      });

      const payload = res?.data;
      const review = payload?.data?.review || payload?.review || payload?.data || null;

      if (review) {
        setMyReview(review);
        // Update local reviews list: put/update this review at the top
        setReviews((prev) => {
          const withoutMine = (prev || []).filter(
            (r) => !(r.user_id === review.user_id && r.app_id === review.app_id)
          );
          return [review, ...withoutMine];
        });
      }

      setReviewSuccess(
        myReview ? 'Review updated successfully.' : 'Review created successfully.'
      );
    } catch (err) {
      console.error('Submit review error:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit review';
      setReviewError(msg);
    } finally {
      setReviewLoading(false);
      setTimeout(() => {
        setReviewError('');
        setReviewSuccess('');
      }, 4000);
    }
  };

  // Get plain text version for display
  const plainDescription = useMemo(() => {
    if (!description) return '';
    return stripHtml(String(description));
  }, [description]);

  const descriptionLength = useMemo(() => {
    return getPlainTextLength(description);
  }, [description]);

  const previewDescription = useMemo(() => {
    if (!plainDescription) return '';
    if (showFullDescription) return plainDescription;
    if (descriptionLength <= 700) return plainDescription;
    // Truncate at word boundary near 700 chars
    const truncated = plainDescription.slice(0, 700);
    const lastSpace = truncated.lastIndexOf(' ');
    const cutPoint = lastSpace > 650 ? lastSpace : 700;
    return `${plainDescription.slice(0, cutPoint)}...`;
  }, [plainDescription, descriptionLength, showFullDescription]);

  const languagesDisplay = useMemo(() => {
    if (!supportedLangs.length) return { primary: [], more: 0, list: [] };
    const limit = 5;
    const primary = showAllLanguages ? supportedLangs : supportedLangs.slice(0, limit);
    const more = Math.max(0, supportedLangs.length - limit);
    return { primary, more, list: supportedLangs, limit };
  }, [supportedLangs, showAllLanguages]);

  const categoriesDisplay = useMemo(() => {
    if (!categories.length) return { primary: [], more: 0, list: [] };
    const limit = 5;
    const primary = showAllCategories ? categories : categories.slice(0, limit);
    const more = Math.max(0, categories.length - limit);
    return { primary, more, list: categories, limit };
  }, [categories, showAllCategories]);

  const metaItems = [
    { label: 'Release date', value: game?.release_date ? formatDate(game.release_date) : '' },
    { label: 'Age rating', value: game?.required_age ? `${game.required_age}+` : '' },
    { label: 'Genres', value: genres.join(', ') },
    { label: 'Categories', value: categories.join(', ') },
    { label: 'Publishers', value: publishers.join(', ') },
    { label: 'Developers', value: developers.join(', ') },
    { label: 'Platforms', value: platformLabels.join(', ') },
    { label: 'Languages', value: supportedLangs.join(', ') },
    { label: 'Website', value: game?.website },
  ].filter((item) => item.value);

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.container}>
          {loading && <div style={styles.badge}>Loading game...</div>}
          {error && <div style={styles.error}>{error}</div>}

          {!loading && !error && game && (
            <>
              <section style={styles.heroSection}>
                <div style={styles.heroLeft}>
                  {headerImage ? (
                    <img src={headerImage} alt={game.title || game.name || 'Game banner'} style={styles.heroImage} />
                  ) : (
                    <div style={styles.bannerPlaceholder}>No image available</div>
                  )}
                  {/* Gallery placeholder if screenshots become available */}
                </div>

                <div style={styles.heroRight}>
                  <h1 style={styles.title}>{game.title || game.name || 'Untitled'}</h1>
                  <div style={styles.priceRow}>
                    <span style={styles.priceCurrent}>{priceInfo.final || 'N/A'}</span>
                    {priceInfo.hasDiscount && priceInfo.original && (
                      <span style={styles.priceOriginal}>{priceInfo.original}</span>
                    )}
                    {priceInfo.hasDiscount && priceInfo.percent > 0 && (
                      <span style={styles.percentBadge}>-{priceInfo.percent}%</span>
                    )}
                  </div>

                  <div style={styles.ctaGroup}>
                    <button 
                      style={styles.ctaPrimary}
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </button>
                    {cartMessage && (
                      <div style={cartMessage.includes('Error') || cartMessage.includes('Failed') ? styles.errorMessage : styles.successMessage}>
                        {cartMessage}
                      </div>
                    )}
                    <button 
                      style={styles.ctaSecondary}
                      onClick={handleWishlistToggle}
                    >
                      {isInWishlist ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
                    </button>
                    {wishlistMessage && (
                      <div style={wishlistMessage.includes('Error') || wishlistMessage.includes('Failed') ? styles.errorMessage : styles.successMessage}>
                        {wishlistMessage}
                      </div>
                    )}
                  </div>

                  <div style={styles.quickInfo}>
                    {developers.length > 0 && (
                      <div style={styles.quickItem}>
                        <span style={styles.quickLabel}>Developer</span>
                        <span style={styles.quickValue}>{developers.join(', ')}</span>
                      </div>
                    )}
                    {publishers.length > 0 && (
                      <div style={styles.quickItem}>
                        <span style={styles.quickLabel}>Publisher</span>
                        <span style={styles.quickValue}>{publishers.join(', ')}</span>
                      </div>
                    )}
                    {game?.release_date && (
                      <div style={styles.quickItem}>
                        <span style={styles.quickLabel}>Release Date</span>
                        <span style={styles.quickValue}>{formatDate(game.release_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section style={styles.contentSection}>
                <div style={styles.aboutCol}>
                  <h2 style={styles.sectionTitle}>About this game</h2>
                  <p style={styles.description}>{previewDescription}</p>
                  {descriptionLength > 700 && (
                    <button style={styles.readMore} onClick={() => setShowFullDescription((s) => !s)}>
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                <aside style={styles.sidebar}>
                  {genres.length > 0 && (
                    <div style={styles.sidebarCard}>
                      <div style={styles.sidebarLabel}>Genres</div>
                      <div style={styles.badgeRow}>
                        {genres.map((g, idx) => (
                          <span key={idx} style={styles.badge}>
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {categoriesDisplay.primary.length > 0 && (
                    <div style={styles.sidebarCard}>
                      <div style={styles.sidebarLabel}>Features</div>
                      <div style={styles.badgeRow}>
                        {categoriesDisplay.primary.map((c, idx) => (
                          <span key={idx} style={styles.badge}>
                            {c}
                          </span>
                        ))}
                        {categoriesDisplay.more > 0 && !showAllCategories && (
                          <button
                            style={styles.moreBadgeButton}
                            onClick={() => setShowAllCategories(true)}
                          >
                            +{categoriesDisplay.more} more
                          </button>
                        )}
                      </div>
                      {showAllCategories && categoriesDisplay.more > 0 && (
                        <button
                          style={styles.readMore}
                          onClick={() => setShowAllCategories(false)}
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}

                  {languagesDisplay.primary.length > 0 && (
                    <div style={styles.sidebarCard}>
                      <div style={styles.sidebarLabel}>Languages</div>
                      <div style={styles.badgeRow}>
                        {languagesDisplay.primary.map((lang, idx) => (
                          <span key={idx} style={styles.badge}>
                            {lang}
                          </span>
                        ))}
                        {languagesDisplay.more > 0 && !showAllLanguages && (
                          <button
                            style={styles.moreBadgeButton}
                            onClick={() => setShowAllLanguages(true)}
                          >
                            +{languagesDisplay.more} more
                          </button>
                        )}
                      </div>
                      {showAllLanguages && languagesDisplay.more > 0 && (
                        <button
                          style={styles.readMore}
                          onClick={() => setShowAllLanguages(false)}
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}
                </aside>
              </section>

              {(minSpecs.length > 0 || recSpecs.length > 0) && (
                <section style={styles.requirementsSection}>
                  <h2 style={styles.sectionTitle}>System Requirements</h2>
                  <div style={styles.specGrid}>
                    {minSpecs.length > 0 && (
                      <div style={styles.specCard}>
                        <h3 style={styles.specTitle}>Minimum</h3>
                        <ul style={styles.specList}>
                          {minSpecs.map((item, idx) => (
                            <li key={idx} style={styles.specItem}>
                              <span style={styles.specLabel}>{item.label}</span>
                              <span style={styles.specValue}>{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recSpecs.length > 0 && (
                      <div style={styles.specCard}>
                        <h3 style={styles.specTitle}>Recommended</h3>
                        <ul style={styles.specList}>
                          {recSpecs.map((item, idx) => (
                            <li key={idx} style={styles.specItem}>
                              <span style={styles.specLabel}>{item.label}</span>
                              <span style={styles.specValue}>{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section style={styles.reviewsSection}>
                <h2 style={styles.sectionTitle}>Player Reviews</h2>

                {/* Review form */}
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview} style={styles.reviewForm}>
                    <div style={styles.reviewToggleRow}>
                      <span style={styles.reviewLabel}>Your recommendation:</span>
                      <div style={styles.toggleGroup}>
                        <button
                          type="button"
                          style={{
                            ...styles.toggleButton,
                            ...(reviewRecommended ? styles.toggleButtonActive : {}),
                          }}
                          onClick={() => setReviewRecommended(true)}
                        >
                          Recommend
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.toggleButton,
                            ...(!reviewRecommended ? styles.toggleButtonActive : {}),
                          }}
                          onClick={() => setReviewRecommended(false)}
                        >
                          Not Recommended
                        </button>
                      </div>
                    </div>

                    <textarea
                      style={styles.reviewTextarea}
                      rows={4}
                      placeholder="Share your thoughts about this game..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />

                    <button
                      type="submit"
                      style={styles.reviewSubmit}
                      disabled={reviewLoading}
                    >
                      {reviewLoading
                        ? 'Saving...'
                        : myReview
                        ? 'Update Review'
                        : 'Submit Review'}
                    </button>

                    {reviewError && <div style={styles.errorMessage}>{reviewError}</div>}
                    {reviewSuccess && (
                      <div style={styles.successMessage}>{reviewSuccess}</div>
                    )}
                  </form>
                ) : (
                  <div style={styles.reviewMessageRow}>
                    <span>Log in to write a review.</span>
                    <button
                      style={styles.loginInlineButton}
                      onClick={() => navigate('/login')}
                    >
                      Login
                    </button>
                  </div>
                )}

                {/* Review stats (optional) */}
                {reviewStats && (
                  <div style={styles.reviewStatsRow}>
                    <span>
                      {`Total reviews: ${reviewStats.total_reviews || 0}`}
                    </span>
                    {typeof reviewStats.recommendation_percentage === 'number' && (
                      <span>
                        {`Recommendation rate: ${reviewStats.recommendation_percentage}%`}
                      </span>
                    )}
                  </div>
                )}

                {/* Reviews list */}
                {reviews && reviews.length > 0 ? (
                  <div style={styles.reviewList}>
                    {reviews.map((r) => (
                      <div key={r.id} style={styles.reviewCard}>
                        <div style={styles.reviewHeader}>
                          <span style={styles.reviewUser}>
                            {r.username || 'User'}
                          </span>
                          <span
                            style={{
                              ...styles.reviewBadge,
                              backgroundColor: r.is_recommended
                                ? '#dcfce7'
                                : '#fee2e2',
                              color: r.is_recommended ? '#166534' : '#b91c1c',
                            }}
                          >
                            {r.is_recommended ? 'Recommended' : 'Not Recommended'}
                          </span>
                        </div>
                        {r.review_text && (
                          <p style={styles.reviewBody}>{r.review_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.noReviewsText}>
                    No reviews yet. Be the first to review this game.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default GameDetail;

const styles = {
  page: {
    background: '#f8f9fb',
    minHeight: '100vh',
    padding: '16px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  badge: {
    fontSize: '14px',
    color: '#6b7280',
  },
  error: {
    color: '#b91c1c',
    fontSize: '14px',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '65% 35%',
    gap: '12px',
    alignItems: 'start',
  },
  heroLeft: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 12px 30px rgba(17,24,39,0.12)',
  },
  heroImage: {
    width: '100%',
    height: '360px',
    objectFit: 'cover',
    display: 'block',
  },
  heroRight: {
    background: '#fff',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 10px 25px rgba(17,24,39,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    color: '#0f172a',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '6px',
  },
  priceCurrent: {
    color: '#16a34a',
    fontWeight: 700,
    fontSize: '18px',
  },
  priceOriginal: {
    color: '#9ca3af',
    textDecoration: 'line-through',
    fontSize: '14px',
  },
  percentBadge: {
    background: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '13px',
  },
  heroBadge: {
    background: '#ef4444',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '12px',
    alignSelf: 'flex-start',
    boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ctaPrimary: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(34,197,94,0.25)',
  },
  ctaSecondary: {
    width: '100%',
    padding: '11px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  quickInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '4px',
  },
  quickItem: {
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  quickLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#6b7280',
  },
  quickValue: {
    fontSize: '14px',
    color: '#0f172a',
  },
  contentSection: {
    display: 'grid',
    gridTemplateColumns: '70% 30%',
    gap: '12px',
    alignItems: 'start',
  },
  aboutCol: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(17,24,39,0.08)',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sidebarCard: {
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 10px 25px rgba(17,24,39,0.08)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sidebarLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 700,
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  badge: {
    background: '#e0f2fe',
    color: '#075985',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
  },
  moreBadgeButton: {
    border: '1px dashed #93c5fd',
    background: '#eff6ff',
    color: '#2563eb',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  readMore: {
    alignSelf: 'flex-start',
    border: 'none',
    background: '#e5e7eb',
    color: '#111827',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
  },
  description: {
    margin: 0,
    color: '#374151',
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  },
  requirementsSection: {
    background: '#f3f4f6',
    borderRadius: '16px',
    padding: '14px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  },
  specCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 6px 16px rgba(17,24,39,0.06)',
  },
  specTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#0f172a',
  },
  specList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  specItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    fontSize: '13px',
  },
  specLabel: {
    color: '#6b7280',
    fontWeight: 700,
  },
  specValue: {
    color: '#0f172a',
    textAlign: 'right',
  },
  successMessage: {
    fontSize: '13px',
    padding: '8px',
    borderRadius: '6px',
    textAlign: 'center',
    marginTop: '4px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: '13px',
    padding: '8px',
    borderRadius: '6px',
    textAlign: 'center',
    marginTop: '4px',
    background: '#fee2e2',
    color: '#dc2626',
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: '14px',
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(15,23,42,0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reviewForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reviewToggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  reviewLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#4b5563',
  },
  toggleGroup: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    padding: '6px 10px',
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleButtonActive: {
    background: '#dcfce7',
    borderColor: '#16a34a',
    color: '#166534',
  },
  reviewTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  reviewSubmit: {
    alignSelf: 'flex-end',
    padding: '8px 16px',
    borderRadius: '999px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reviewMessageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#4b5563',
  },
  loginInlineButton: {
    border: 'none',
    background: 'transparent',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
  },
  reviewStatsRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#6b7280',
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  reviewCard: {
    padding: '10px',
    borderRadius: '10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  reviewUser: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  reviewBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  reviewBody: {
    margin: 0,
    fontSize: '13px',
    color: '#374151',
  },
  noReviewsText: {
    fontSize: '13px',
    color: '#6b7280',
  },
};
