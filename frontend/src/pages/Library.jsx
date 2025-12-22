import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/common/PrivateRoute';
import api from '../services/api';
import '../styles/Library.css';

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
      <main className="library-page">
        <div className="library-shell">
          <div className="library-header">
            <div>
              <h1 className="library-title">My Library</h1>
              <p className="library-subtitle">All the games you own, ready to play.</p>
            </div>
            <div className="library-accent" aria-hidden="true" />
          </div>

          {loading && (
            <div className="library-message">Loading your library...</div>
          )}

          {error && (
            <div className="library-error">{error}</div>
          )}

          {!loading && !error && games.length === 0 && (
            <div className="library-empty">
              <p>Your library is empty.</p>
              <p className="library-empty-sub">Games you purchase will appear here.</p>
              <button
                className="library-browse"
                onClick={() => navigate('/browse')}
                type="button"
              >
                Browse Games
              </button>
            </div>
          )}

          {!loading && !error && games.length > 0 && (
            <>
              <div className="library-list">
                {games.map((game, index) => (
                  <div
                    key={game.app_id}
                    className="library-card"
                    style={{ '--delay': `${index * 70}ms` }}
                  >
                    <div
                      className="library-clickable"
                      onClick={() => navigate(`/game/${game.app_id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/game/${game.app_id}`);
                        }
                      }}
                    >
                      <div className="library-image">
                        <img
                          src={game.header_image || '/placeholder-game.jpg'}
                          alt={game.name}
                          className="library-image-img"
                        />
                      </div>
                    </div>
                    <div className="library-content">
                      <h3 className="library-name">{game.name}</h3>
                      <button
                        className="library-review-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReviewPanel(game);
                        }}
                        type="button"
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
                <section className="library-review">
                  <h2 className="library-review-title">
                    {`Your Review for ${selectedGame.name}`}
                  </h2>
                  <form onSubmit={handleSubmitReview} className="library-review-form">
                    <div className="library-review-row">
                      <span className="library-review-label">Your recommendation:</span>
                      <div className="library-toggle-group">
                        <button
                          type="button"
                          className={`library-toggle-btn${
                            reviewRecommended ? ' is-active' : ''
                          }`}
                          onClick={() => setReviewRecommended(true)}
                        >
                          Recommend
                        </button>
                        <button
                          type="button"
                          className={`library-toggle-btn${
                            !reviewRecommended ? ' is-active' : ''
                          }`}
                          onClick={() => setReviewRecommended(false)}
                        >
                          Not Recommended
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="library-review-textarea"
                      rows={4}
                      placeholder="Share your thoughts about this game..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />

                    <div className="library-review-actions">
                      <button
                        type="button"
                        className="library-cancel-btn"
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
                        className="library-submit-btn"
                        disabled={reviewLoading}
                      >
                        {reviewLoading
                          ? 'Saving...'
                          : myReview
                          ? 'Update Review'
                          : 'Submit Review'}
                      </button>
                    </div>

                    {reviewError && (
                      <div className="library-review-error">{reviewError}</div>
                    )}
                    {reviewSuccess && (
                      <div className="library-review-success">{reviewSuccess}</div>
                    )}
                  </form>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </PrivateRoute>
  );
};

export default Library;

