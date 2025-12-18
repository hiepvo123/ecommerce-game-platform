import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';
import api from '../../services/api';
import EditGameModal from './EditGameModal';
import { referenceService } from '../../services/referenceService';
import { gameService } from '../../services/gameService';

const PAGE_SIZE = 20;

const GamesManagement = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [refOptions, setRefOptions] = useState({
    languages: [],
    genres: [],
    categories: [],
  });

  const normalizeGames = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.games)) return res.games;
    if (Array.isArray(res?.data?.games)) return res.data.games;
    return [];
  };

  const handleView = async (appId) => {
  try {
    const res = await api.get(`/admin/games/${appId}`);
    setSelectedGame(res.data.data);
    setShowEdit(true);
  } catch (err) {
    alert('Failed to load game detail');
  }
};


  // Load reference options for filters
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [langsRes, genresRes, categoriesRes] = await Promise.all([
          referenceService.getLanguages(),
          referenceService.getGenres(),
          referenceService.getCategories(),
        ]);

        const normalizeList = (res, key) => {
          const list =
            res?.data?.[key] ||
            res?.[key] ||
            res?.data ||
            res ||
            [];
          return Array.isArray(list) ? list : [];
        };

        setRefOptions({
          languages: normalizeList(langsRes, 'languages'),
          genres: normalizeList(genresRes, 'genres'),
          categories: normalizeList(categoriesRes, 'categories'),
        });
      } catch (err) {
        console.error('Failed to load reference data for filters:', err);
      }
    };

    loadReferences();
  }, []);

  const fetchGames = async ({ reset = false } = {}) => {
    try {
      if (reset) {
        setLoading(true);
        setError('');
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : games.length;
      const baseParams = {
        limit: PAGE_SIZE,
        offset,
        sortBy,
        order: sortOrder,
      };

      const trimmed = searchTerm.trim();
      let res;

      if (trimmed) {
        // Full-text search across all games
        res = await gameService.searchGames(trimmed, baseParams);
      } else if (genreFilter !== 'all') {
        // Filter by single genre (+ optional language)
        res = await gameService.getGamesByGenre(genreFilter, {
          ...baseParams,
          languageId: languageFilter !== 'all' ? languageFilter : undefined,
        });
      } else if (categoryFilter !== 'all') {
        // Filter by single category (+ optional language)
        res = await gameService.getGamesByCategory(categoryFilter, {
          ...baseParams,
          languageId: languageFilter !== 'all' ? languageFilter : undefined,
        });
      } else {
        // Base listing with platform / language filters
        res = await gameService.getGames({
          ...baseParams,
          platform: platformFilter !== 'all' ? platformFilter : undefined,
          languageId: languageFilter !== 'all' ? languageFilter : undefined,
        });
      }

      const list = normalizeGames(res);

      if (reset) {
        setGames(list);
      } else {
        setGames((prev) => [...prev, ...list]);
      }

      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load games';
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
    fetchGames({ reset: true });
  }, [sortBy, sortOrder, searchTerm, platformFilter, languageFilter, genreFilter, categoryFilter]);

  const handleTableScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;

    if (!loading && !loadingMore && hasMore && nearBottom) {
      fetchGames({ reset: false });
    }
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return 'Free';
    return `$${num.toFixed(2)}`;
  };

  const filteredGames = games;

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Games Management</h1>
              <p style={styles.subtitle}>View and manage all games</p>
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
                placeholder="Search by name or App ID"
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
                <option value="name">Name</option>
                <option value="price_final">Price</option>
                <option value="discount_percent">Discount</option>
                <option value="release_date">Release date</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={styles.select}
              >
                <option value="ASC">Asc</option>
                <option value="DESC">Desc</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All platforms</option>
                <option value="windows">Windows</option>
                <option value="mac">Mac</option>
                <option value="linux">Linux</option>
              </select>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All languages</option>
                {refOptions.languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All genres</option>
                {refOptions.genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All categories</option>
                {refOptions.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={styles.message}>Loading games...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : games.length === 0 ? (
            <div style={styles.message}>No games found.</div>
          ) : filteredGames.length === 0 ? (
            <div style={styles.message}>No games match your search or filters.</div>
          ) : (
            <div style={styles.tableContainer} onScroll={handleTableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>App ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Discount</th>
                    <th style={styles.th}>Final Price</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr key={game.app_id}>
                      <td style={styles.td}>#{game.app_id}</td>
                      <td style={styles.td}>{game.name || '—'}</td>
                      <td style={styles.td}>
                        {game.discount_percent > 0
                          ? formatPrice(game.price_final / (1 - game.discount_percent / 100))
                          : formatPrice(game.price_final)}
                      </td>
                      <td style={styles.td}>
                        {game.discount_percent > 0 ? (
                          <span style={styles.discountBadge}>
                            -{game.discount_percent}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={styles.td}>
                        <strong>{formatPrice(game.price_final)}</strong>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() => handleView(game.app_id)}                
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingMore && (
                <div style={styles.loadingMore}>Loading more games...</div>
              )}
            </div>
          )}
        </div>
      </main>
  
      {showEdit && selectedGame && (
        <EditGameModal
          game={selectedGame}
          onClose={() => setShowEdit(false)}
          onSave={async (appId, data) => {
            await adminService.updateGame(appId, data);
            setGames(prev =>
              prev.map(g => g.app_id === appId ? { ...g, ...data } : g)
            );
          }}
        />
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
  discountBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#ef4444',
  },
  viewButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #3b82f6',
    background: '#fff',
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '12px',
    transition: 'background 0.2s',
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
};

export default GamesManagement;

