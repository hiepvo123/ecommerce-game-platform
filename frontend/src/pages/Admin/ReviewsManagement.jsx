import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';

const PAGE_SIZE = 20;

const ReviewsManagement = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('review_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [verdictFilter, setVerdictFilter] = useState('all'); // all | recommended | not
  const [replyFilter, setReplyFilter] = useState('all'); // all | with | without

  const [activeReview, setActiveReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchReviews = async ({ reset = false } = {}) => {
    try {
      if (reset) {
        setLoading(true);
        setError('');
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : reviews.length;

      const params = {
        limit: PAGE_SIZE,
        offset,
        sortBy,
        order: sortOrder,
        q: searchTerm.trim() || undefined,
      };

      if (verdictFilter === 'recommended') params.isRecommended = true;
      if (verdictFilter === 'not') params.isRecommended = false;

      if (replyFilter === 'with') params.hasReply = 'true';
      if (replyFilter === 'without') params.hasReply = 'false';

      const response = await adminService.getAllReviews(params);

      const list =
        response?.data?.reviews ||
        response?.reviews ||
        [];

      const safeList = Array.isArray(list) ? list : [];

      if (reset) {
        setReviews(safeList);
      } else {
        setReviews(prev => [...prev, ...safeList]);
      }

      setHasMore(safeList.length === PAGE_SIZE);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load reviews';
      setError(msg);
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchReviews({ reset: true });
  }, [sortBy, sortOrder, searchTerm, verdictFilter, replyFilter]);

  const handleTableScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;

    if (!loading && !loadingMore && hasMore && nearBottom) {
      fetchReviews({ reset: false });
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleString();
    } catch {
      return String(val);
    }
  };

  const openReplyModal = (review) => {
    setActiveReview(review);
    setReplyText(review.reply_text || '');
    setModalError('');
    setModalSuccess('');
  };

  const closeReplyModal = () => {
    setActiveReview(null);
    setReplyText('');
    setSavingReply(false);
    setModalError('');
    setModalSuccess('');
  };

  const handleSaveReply = async () => {
    if (!activeReview) return;
    const text = replyText.trim();
    if (!text) {
      setModalError('Reply text is required');
      return;
    }

    try {
      setSavingReply(true);
      setModalError('');
      const res = await adminService.replyToReview(activeReview.id, text);
      const reply = res?.data?.reply || res?.reply || res?.data || null;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === activeReview.id
            ? {
                ...r,
                reply_text: text,
                has_reply: true,
                reply_updated_at: reply?.updated_at || r.reply_updated_at,
              }
            : r
        )
      );

      setModalSuccess('Reply saved');
      setTimeout(() => {
        closeReplyModal();
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save reply';
      setModalError(msg);
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Reviews Management</h1>
              <p style={styles.subtitle}>Review and moderate all user reviews.</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {/* Filters / search */}
          <div style={styles.toolbar}>
            <div style={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search by game, user, email, or review text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.toolbarRight}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="review_at">Reviewed At</option>
                <option value="id">Review ID</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={styles.select}
              >
                <option value="DESC">Newest first</option>
                <option value="ASC">Oldest first</option>
              </select>
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All verdicts</option>
                <option value="recommended">Recommended</option>
                <option value="not">Not recommended</option>
              </select>
              <select
                value={replyFilter}
                onChange={(e) => setReplyFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All</option>
                <option value="with">With reply</option>
                <option value="without">Without reply</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={styles.message}>Loading reviews...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : reviews.length === 0 ? (
            <div style={styles.message}>No reviews found.</div>
          ) : (
            <div style={styles.tableContainer} onScroll={handleTableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Game</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Verdict</th>
                    <th style={styles.th}>Review</th>
                    <th style={styles.th}>Reviewed At</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => (
                    <tr key={rev.id}>
                      <td style={styles.td}>#{rev.id}</td>
                      <td style={styles.td}>{rev.game_name || `#${rev.app_id}`}</td>
                      <td style={styles.td}>{rev.username || rev.email || `User #${rev.user_id}`}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.verifiedBadge,
                            backgroundColor: rev.is_recommended ? '#10b981' : '#ef4444',
                          }}
                        >
                          {rev.is_recommended ? 'Recommended' : 'Not recommended'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {rev.review_text && rev.review_text.length > 80
                          ? `${rev.review_text.slice(0, 80)}…`
                          : rev.review_text || '—'}
                      </td>
                      <td style={styles.td}>{formatDate(rev.review_at)}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.replyButton}
                          onClick={() => openReplyModal(rev)}
                        >
                          {rev.has_reply ? 'Edit reply' : 'Reply'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingMore && (
                <div style={styles.loadingMore}>Loading more reviews...</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Reply Modal */}
      {activeReview && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Reply to Review #{activeReview.id}</h2>
            <p style={styles.modalMeta}>
              <strong>Game:</strong> {activeReview.game_name || `#${activeReview.app_id}`}
              <br />
              <strong>User:</strong> {activeReview.username || activeReview.email || `User #${activeReview.user_id}`}
            </p>
            <div style={styles.modalOriginalReview}>
              <div style={styles.modalLabel}>Original review</div>
              <p style={styles.modalReviewText}>
                {activeReview.review_text || '—'}
              </p>
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Your reply</label>
              <textarea
                style={styles.modalTextarea}
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
            {modalError && <div style={styles.modalError}>{modalError}</div>}
            {modalSuccess && <div style={styles.modalSuccess}>{modalSuccess}</div>}
            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.modalSecondary}
                onClick={closeReplyModal}
                disabled={savingReply}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.modalPrimary}
                onClick={handleSaveReply}
                disabled={savingReply}
              >
                {savingReply ? 'Saving...' : 'Save reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fb',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  searchWrapper: {
    flex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
  },
  toolbarRight: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    background: '#f9fafb',
  },
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '70vh',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#111827',
    fontSize: '14px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
  },
  verifiedBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  replyButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #3b82f6',
    background: '#fff',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#6b7280',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#ef4444',
    background: '#fef2f2',
    borderRadius: '8px',
  },
  loadingMore: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15,23,42,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px 24px 24px',
    width: '600px',
    maxWidth: '95vw',
    boxShadow: '0 18px 45px rgba(15,23,42,0.16)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
  },
  modalMeta: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#6b7280',
  },
  modalOriginalReview: {
    marginTop: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
  },
  modalLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '4px',
  },
  modalReviewText: {
    margin: 0,
    fontSize: '13px',
    color: '#374151',
  },
  modalField: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalTextarea: {
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    padding: '10px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  modalActions: {
    marginTop: '14px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  modalPrimary: {
    padding: '8px 16px',
    borderRadius: '999px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalSecondary: {
    padding: '8px 16px',
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  modalError: {
    marginTop: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: '#fee2e2',
    color: '#b91c1c',
    fontSize: '13px',
  },
  modalSuccess: {
    marginTop: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: '#dcfce7',
    color: '#166534',
    fontSize: '13px',
  },
};

export default ReviewsManagement;


