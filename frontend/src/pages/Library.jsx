import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/common/PrivateRoute';
import api from '../services/api';

const Library = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRecommended, setReviewRecommended] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchLibrary();
    }
  }, [isAuthenticated]);

  const fetchLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/library');
      const payload = res?.data;

      const data =
        payload?.data?.games ||
        payload?.games ||
        (Array.isArray(payload) ? payload : []);

      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Library fetch error:', err);
      setError('Failed to load library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openReviewPanel = async (game) => {
    setSelectedGame(game);
    setMyReview(null);
    setReviewText('');
    setReviewRecommended(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await api.get(`/games/${game.app_id}/review/me`);
      const payload = res?.data;
      const review = payload?.data?.review || payload?.review || null;
      if (review) {
        setMyReview(review);
        setReviewText(review.review_text || '');
        setReviewRecommended(Boolean(review.is_recommended));
      }
    } catch (err) {
      // If 401, interceptor will redirect on protected routes; otherwise, ignore missing review
      if (err.response && err.response.status !== 404) {
        console.error('Fetch my review error:', err);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedGame) return;

    setReviewError('');
    setReviewSuccess('');

    try {
      setReviewLoading(true);
      const res = await api.post('/library/review', {
        appId: selectedGame.app_id,
        isRecommended: reviewRecommended,
        reviewText: reviewText.trim(),
      });

      const payload = res?.data;
      const review = payload?.data?.review || payload?.review || payload?.data || null;
      if (review) {
        setMyReview(review);
      }

      setReviewSuccess(myReview ? 'Review updated successfully.' : 'Review created successfully.');
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

  return (
    <PrivateRoute>
      <Navbar />
      <main style={styles.container}>
        <h1 style={styles.title}>My Library</h1>
        
        {loading && (
          <div style={styles.message}>Loading your library...</div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {!loading && !error && games.length === 0 && (
          <div style={styles.message}>
            <p>Your library is empty.</p>
            <p style={styles.subMessage}>Games you purchase will appear here.</p>
            <button
              style={styles.browseButton}
              onClick={() => navigate('/browse')}
            >
              Browse Games
            </button>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <>
            <div style={styles.gamesGrid}>
              {games.map((game) => (
                <div
                  key={game.app_id}
                  style={styles.gameCard}
                >
                  <div
                    style={styles.gameClickable}
                    onClick={() => navigate(`/game/${game.app_id}`)}
                  >
                    <div style={styles.gameImage}>
                      <img
                        src={game.header_image || '/placeholder-game.jpg'}
                        alt={game.name}
                        style={styles.image}
                      />
                    </div>
                    <div style={styles.gameInfo}>
                      <h3 style={styles.gameName}>{game.name}</h3>
                    </div>
                  </div>
                  <div style={styles.gameActions}>
                    <button
                      style={styles.reviewButton}
                      onClick={() => openReviewPanel(game)}
                    >
                      {selectedGame && selectedGame.app_id === game.app_id
                        ? 'Editing Review'
                        : 'Write a Review'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedGame && (
              <section style={styles.reviewPanel}>
                <h2 style={styles.reviewTitle}>
                  {`Your Review for ${selectedGame.name}`}
                </h2>
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

                  <div style={styles.reviewActionsRow}>
                    <button
                      type="button"
                      style={styles.cancelButton}
                      onClick={() => {
                        setSelectedGame(null);
                        setMyReview(null);
                        setReviewText('');
                        setReviewRecommended(true);
                        setReviewError('');
                        setReviewSuccess('');
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={reviewLoading}
                    >
                      {reviewLoading
                        ? 'Saving...'
                        : myReview
                        ? 'Update Review'
                        : 'Submit Review'}
                    </button>
                  </div>

                  {reviewError && <div style={styles.reviewError}>{reviewError}</div>}
                  {reviewSuccess && <div style={styles.reviewSuccess}>{reviewSuccess}</div>}
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </PrivateRoute>
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
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  gameCard: {
    background: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  gameClickable: {
    cursor: 'pointer',
  },
  gameActions: {
    padding: '8px 12px 12px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  reviewButton: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid #3b82f6',
    background: '#fff',
    color: '#1d4ed8',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  gameImage: {
    position: 'relative',
    width: '100%',
    paddingTop: '75%',
    background: '#f0f0f0',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  gameInfo: {
    padding: '12px',
  },
  gameName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  message: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
    fontSize: '1.1rem',
  },
  subMessage: {
    fontSize: '0.9rem',
    color: '#999',
    marginTop: '8px',
  },
  browseButton: {
    marginTop: '24px',
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
  error: {
    textAlign: 'center',
    padding: '24px',
    color: '#dc2626',
    background: '#fee2e2',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  reviewPanel: {
    marginTop: '32px',
    padding: '16px',
    borderRadius: '12px',
    background: '#f9fafb',
    boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
  },
  reviewTitle: {
    margin: '0 0 12px',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#111827',
  },
  reviewForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reviewToggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  reviewLabel: {
    fontSize: '0.9rem',
    color: '#4b5563',
    fontWeight: 600,
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
    fontSize: '0.85rem',
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
    fontSize: '0.95rem',
  },
  reviewActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  cancelButton: {
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '8px 16px',
    borderRadius: '999px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reviewError: {
    marginTop: '4px',
    fontSize: '0.85rem',
    padding: '6px 8px',
    borderRadius: '6px',
    background: '#fee2e2',
    color: '#b91c1c',
  },
  reviewSuccess: {
    marginTop: '4px',
    fontSize: '0.85rem',
    padding: '6px 8px',
    borderRadius: '6px',
    background: '#dcfce7',
    color: '#166534',
  },
};

export default Library;

