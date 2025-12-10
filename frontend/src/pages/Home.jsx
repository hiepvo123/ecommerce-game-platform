import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import HeroCarousel from '../components/layout/HeroCarousel';
import { referenceService } from '../services/referenceService';
import { gameService } from '../services/gameService';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState('');
  const [recommended, setRecommended] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState('');
  const [discounted, setDiscounted] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const normalizeGames = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.games)) return res.games;
    if (Array.isArray(res?.data?.games)) return res.data.games;
    return [];
  };

  const formatDate = (val) => {
    if (!val) return '';
    const str = String(val);
    if (str.includes(' ')) return str.split(' ')[0];
    if (str.includes('T')) return str.split('T')[0];
    return str.slice(0, 10);
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined) return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    const str = String(val);
    return str.startsWith('$') ? str : `$${str}`;
  };

  useEffect(() => {
    const loadReference = async () => {
      setRefLoading(true);
      setRefError('');
      try {
        const [langs, cats, gens] = await Promise.all([
          referenceService.getLanguages(),
          referenceService.getCategories(),
          referenceService.getGenres(),
        ]);
        setLanguages(langs?.data || langs || []);
        setCategories(cats?.data || cats || []);
        setGenres(gens?.data || gens || []);
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setRefError(apiError || 'Unable to load references');
      } finally {
        setRefLoading(false);
      }
    };

    loadReference();
  }, []);

  useEffect(() => {
    const loadRecommended = async () => {
      setGamesLoading(true);
      setGamesError('');
      try {
        const res = await gameService.getRecommendedGames();
        let games = normalizeGames(res);
        if (!games.length) {
          const fallbackRes = await gameService.getGames({ limit: 12 });
          games = normalizeGames(fallbackRes);
        }
        setRecommended(games);
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setGamesError(apiError || 'Unable to load games');
      } finally {
        setGamesLoading(false);
      }
    };
    loadRecommended();
  }, []);

  useEffect(() => {
    const loadDiscounted = async () => {
      setDiscountLoading(true);
      setDiscountError('');
      try {
        const res = await gameService.getDiscountedGames();
        let games = normalizeGames(res);
        if (!games.length) {
          const fallbackRes = await gameService.getGames({ hasDiscount: true, limit: 12 });
          games = normalizeGames(fallbackRes);
        }
        setDiscounted(games);
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setDiscountError(apiError || 'Unable to load discounted games');
      } finally {
        setDiscountLoading(false);
      }
    };
    loadDiscounted();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await gameService.searchGames(searchTerm.trim());
      setSearchResults(normalizeGames(res));
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setSearchError(apiError || 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // Silent fail; AuthContext already handles error display elsewhere
    }
  };

  const renderList = (items) => {
    const list = Array.isArray(items) ? items : [];
    return list.slice(0, 12).map((item) => (
      <div key={item.id || item.name || item.title} style={styles.pill}>
        {item.name || item.title || item.label}
      </div>
    ));
  };

  const heroItemsFromData = () => {
    const list = Array.isArray(recommended) ? recommended : [];
    return list.slice(0, 6).map((g, idx) => ({
      id: g.id || g.appId || idx,
      badge: g.discount ? 'hot' : '',
      badgeLabel: g.discount ? 'Hot' : '',
      title: g.title || g.name || 'Untitled',
      subtitle: g.genre || g.category || g.description || 'Recommended for you',
      price:
        g.price?.toString().includes('$') ? g.price : g.price ? `${g.price} US$` : g.final_price ? `${g.final_price} US$` : 'Free',
      image: g.image || g.header_image || g.thumbnail || '',
    }));
  };

  const cardGrid = (items) => (
    <div style={styles.cardGrid}>
      {items.map((g) => (
        <div key={g.id} style={styles.card}>
          <div style={styles.cardImageWrap}>
            <img src={g.image} alt={g.title} style={styles.cardImage} />
          </div>
          <div style={styles.cardBody}>
            <div style={styles.pillRow}>
              {g.releaseDate && <span style={styles.pill}>{g.releaseDate}</span>}
              {g.originalPrice && <span style={styles.pill}>{g.originalPrice}</span>}
              {g.discountPrice && <span style={styles.pill}>{g.discountPrice}</span>}
            </div>
            <div style={styles.cardTitle}>{g.title}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const mapDiscounted = () =>
    (Array.isArray(discounted) ? discounted : []).slice(0, 8).map((g, idx) => ({
      id: g.id || g.appId || `disc-${idx}`,
      title: g.title || g.name || 'Untitled',
      description: g.description || g.genre || g.category || 'Discounted pick',
      price:
        g.price?.toString().includes('$') ? g.price : g.price ? `$${g.price}` : g.final_price ? `$${g.final_price}` : 'Free',
      image: g.image || g.header_image || g.thumbnail || '',
    }));

  const mapSearchResults = () =>
    (Array.isArray(searchResults) ? searchResults : []).slice(0, 12).map((g, idx) => ({
      id: g.id || g.appId || `search-${idx}`,
      title: g.title || g.name || 'Untitled',
      description: g.description || g.genre || g.category || 'Search result',
      price:
        g.price?.toString().includes('$') ? g.price : g.price ? `$${g.price}` : g.final_price ? `$${g.final_price}` : 'Free',
      image: g.image || g.header_image || g.thumbnail || '',
    }));

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Discover games you love</h1>
            <p style={styles.subheading}>Browse by language, category, or genre.</p>
          </div>
        </div>

        {gamesError && <div style={styles.error}>{gamesError}</div>}
        {heroItemsFromData().length > 0 && <HeroCarousel items={heroItemsFromData()} />}

        <form style={styles.searchRow} onSubmit={handleSearch}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={styles.button} type="submit" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchError && <div style={styles.error}>{searchError}</div>}
        {searchResults.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Search results</h2>
            </div>
            {cardGrid(mapSearchResults())}
          </section>
        )}

        {recommended.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Recommended for you</h2>
              {gamesLoading && <span style={styles.badge}>Loading...</span>}
            </div>
            {cardGrid(
              recommended.slice(0, 12).map((g, idx) => {
                const hasDiscount = Number(g.discount_percent) > 0;
                const discountPrice = hasDiscount
                  ? formatPrice(g.final_price ?? g.price)
                  : '';
                const originalPrice = hasDiscount
                  ? formatPrice(g.original_price ?? g.originalPrice ?? g.price)
                  : formatPrice(g.price ?? g.original_price ?? g.originalPrice);
                return {
                  id: g.id || g.appId || idx,
                  title: g.title || g.name || 'Untitled',
                  releaseDate: formatDate(g.release_date || g.releaseDate || ''),
                  discountPrice,
                  originalPrice,
                  image: g.image || g.header_image || g.thumbnail,
                };
              })
            )}
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Discounted games</h2>
            {discountLoading && <span style={styles.badge}>Loading...</span>}
            {discountError && <span style={styles.error}>{discountError}</span>}
          </div>
          {cardGrid(
            mapDiscounted().map((g) => {
              const hasDiscount = Number(g.discount_percent) > 0;
              const discountPrice = hasDiscount
                ? formatPrice(g.final_price ?? g.price)
                : '';
              const originalPrice = hasDiscount
                ? formatPrice(g.original_price ?? g.originalPrice ?? g.price)
                : formatPrice(g.price ?? g.original_price ?? g.originalPrice);
              return {
                ...g,
                releaseDate: formatDate(g.release_date || g.releaseDate || ''),
                discountPrice,
                originalPrice,
              };
            })
          )}
        </section>

        <section style={styles.referenceSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Reference</h2>
            {refLoading && <span style={styles.badge}>Loading...</span>}
            {refError && <span style={styles.error}>{refError}</span>}
          </div>
          <div style={styles.refGrid}>
            <div style={styles.refCard}>
              <div style={styles.refTitle}>Languages</div>
              <div style={styles.pillWrap}>{renderList(languages)}</div>
            </div>
            <div style={styles.refCard}>
              <div style={styles.refTitle}>Categories</div>
              <div style={styles.pillWrap}>{renderList(categories)}</div>
            </div>
            <div style={styles.refCard}>
              <div style={styles.refTitle}>Genres</div>
              <div style={styles.pillWrap}>{renderList(genres)}</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;

const styles = {
  page: {
    padding: '16px 22px 40px',
    background: '#f8f9fb',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  heading: {
    margin: 0,
    fontSize: '26px',
    color: '#111827',
  },
  subheading: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  button: {
    height: '42px',
    padding: '0 18px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(239,68,68,0.2)',
  },
  referenceSection: {
    marginTop: '28px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#111827',
  },
  badge: {
    fontSize: '12px',
    color: '#6b7280',
  },
  error: {
    fontSize: '12px',
    color: '#b91c1c',
  },
  refGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  refCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  },
  refTitle: {
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '10px',
  },
  pillWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pill: {
    padding: '8px 10px',
    borderRadius: '10px',
    background: '#f3f4f6',
    color: '#374151',
    fontSize: '13px',
    border: '1px solid #e5e7eb',
  },
  section: {
    marginTop: '28px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardImageWrap: {
    width: '100%',
    height: '140px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardTitle: {
    fontWeight: 700,
    color: '#111827',
    fontSize: '15px',
  },
  cardMeta: {
    color: '#6b7280',
    fontSize: '13px',
  },
  searchRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
    marginBottom: '8px',
  },
  searchInput: {
    flex: 1,
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '0 12px',
    fontSize: '14px',
  },
  pillRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#fee2e2',
    color: '#b91c1c',
    fontWeight: 600,
    fontSize: '12px',
    border: '1px solid #fca5a5',
  },
};
