import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import HeroCarousel from '../components/layout/HeroCarousel';
import { gameService } from '../services/gameService';
import { referenceService } from '../services/referenceService';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';

// Custom dropdown to allow fully stylable option lists
const CustomDropdown = ({ options = [], value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = options.length ? options : [{ value: '', label: 'Any' }];
  const selectedOption = safeOptions.find((opt) => opt.value === value) || safeOptions[0];

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        [data-dropdown-list]::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          ...styles.selectAccent,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span>{selectedOption.label}</span>
        <span
          style={{
            fontSize: '10px',
            color: '#3b82f6',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div
          data-dropdown-list
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '4px',
          }}
        >
          {safeOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: opt.value === value ? '#eff6ff' : 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  opt.value === value ? '#eff6ff' : 'transparent')
              }
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const { logout, isAuthenticated } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist, fetchWishlist } = useWishlist();
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState('');
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [priceOrder, setPriceOrder] = useState('ASC');
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allFilteredGames, setAllFilteredGames] = useState([]); // Cache for all filtered games
  const [genreOptions, setGenreOptions] = useState([{ value: '', label: 'Any' }]);
  const [categoryOptions, setCategoryOptions] = useState([{ value: '', label: 'Any' }]);
  const [languageOptions, setLanguageOptions] = useState([{ value: '', label: 'Any' }]);
  const [filters, setFilters] = useState({
    sortBy: 'price_final',
    order: 'ASC',
    platform: '',
    minPrice: '',
    maxPrice: '',
    genreId: '',
    categoryId: '',
    languageId: '',
  });
  const [ownedIdsRaw, setOwnedIdsRaw] = useState([]);

  const ownedIds = useMemo(() => {
    const ids = (Array.isArray(ownedIdsRaw) ? ownedIdsRaw : []).filter(
      (id) => id !== null && id !== undefined
    );
    const set = new Set();
    ids.forEach((id) => {
      set.add(String(id));
      set.add(Number(id));
    });
    return set;
  }, [ownedIdsRaw]);

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

  const wishlistIds = useMemo(() => {
    const set = new Set();
    const list = Array.isArray(wishlist) ? wishlist : [];
    list.forEach((w) => {
      const id = w.appId || w.app_id || w.id;
      if (id !== undefined && id !== null) {
        set.add(String(id));
        set.add(Number(id));
      }
    });
    return set;
  }, [wishlist]);

  useEffect(() => {
    const loadOwnedLibrary = async () => {
      if (!isAuthenticated) {
        setOwnedIdsRaw([]);
        return;
      }
      try {
        const res = await api.get('/library');
        const payload = res?.data;
        const data =
          payload?.data?.games ||
          payload?.games ||
          (Array.isArray(payload) ? payload : []);

        const ids = (Array.isArray(data) ? data : []).map(
          (g) => g.app_id || g.appId || g.id
        );
        setOwnedIdsRaw(ids.filter((id) => id !== null && id !== undefined));
      } catch (err) {
        // Fail silently; home can still show games
        console.error('Failed to load library for home filtering:', err);
      }
    };

    loadOwnedLibrary();
  }, [isAuthenticated]);

  const isOwnedGame = useCallback(
    (game) => {
      const id = game?.app_id || game?.appId || game?.id;
      if (id === undefined || id === null) return false;
      return ownedIds.has(String(id)) || ownedIds.has(Number(id));
    },
    [ownedIds]
  );

  const handleToggleWishlist = async (appId) => {
    if (!appId) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const keyStr = String(appId);
    try {
      if (wishlistIds.has(keyStr) || wishlistIds.has(Number(appId))) {
        await removeFromWishlist(appId);
      } else {
        await addToWishlist(appId);
      }
      await fetchWishlist();
    } catch (err) {
      // silently fail for now
    }
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    const str = String(val).trim();
    if (!str) return '';
    return str.startsWith('$') ? str : `$${str}`;
  };

  const extractPrices = (g) => {
    // backend fields are price_org, price_final, discount_percent
    const originalRaw = g.original_price ?? g.price_org ?? g.price ?? g.list_price;
    const finalRaw = g.final_price ?? g.price_final ?? g.discount_price ?? g.price_after_discount ?? g.price;

    const apiPercent = Number(g.discount_percent) > 0 ? Number(g.discount_percent) : 0;
    const computedPercent =
      originalRaw && finalRaw && Number(originalRaw) > 0
        ? Math.round(((Number(originalRaw) - Number(finalRaw)) / Number(originalRaw)) * 100)
        : 0;
    const discountPercent = apiPercent || computedPercent || 0;

    const hasDiscountFlag =
      discountPercent > 0 ||
      (finalRaw !== undefined &&
        originalRaw !== undefined &&
        Number(finalRaw) < Number(originalRaw));

    const discountPrice = hasDiscountFlag ? formatPrice(finalRaw) : '';
    const originalPrice = hasDiscountFlag ? formatPrice(originalRaw) : formatPrice(originalRaw ?? finalRaw) || '';

    return {
      hasDiscount: Boolean(hasDiscountFlag),
      discountPrice,
      originalPrice,
      discountPercent,
      base: formatPrice(finalRaw ?? originalRaw),
    };
  };

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
        const filtered = games.filter((g) => !isOwnedGame(g));
        setRecommended(filtered);
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
  }, [isOwnedGame]);

  useEffect(() => {
    const loadFeatured = async () => {
      setFeaturedLoading(true);
      setFeaturedError('');
      try {
        const res = await gameService.getFeaturedGames({ limit: 20 });
        let games = normalizeGames(res);
        if (!games.length) {
          const fallbackRes = await gameService.getGames({ limit: 20 });
          games = normalizeGames(fallbackRes);
        }
        const filtered = games.filter((g) => !isOwnedGame(g));
        setFeatured(filtered.slice(0, 20));
        if (!hasInteracted) {
          setCatalog(filtered.slice(0, 20));
        }
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setFeaturedError(apiError || 'Unable to load popular games');
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeatured();
  }, [hasInteracted, isOwnedGame]);

  useEffect(() => {
    const loadReferences = async () => {
      const mapOptions = (list = []) =>
        list
          .filter(Boolean)
          .map((item) => ({
            value:
              item.id ??
              item.language_id ??
              item.genre_id ??
              item.category_id ??
              item.code ??
              item.value ??
              '',
            label: item.name || item.label || item.code || item.value || 'Unknown',
          }));

      try {
        const [langsRes, genresRes, categoriesRes] = await Promise.all([
          referenceService.getLanguages(),
          referenceService.getGenres(),
          referenceService.getCategories(),
        ]);

        const normalizeRef = (res, key) => {
          const list =
            res?.data?.[key] ||
            res?.[key] ||
            res?.data ||
            res ||
            [];
          return Array.isArray(list) ? list : [];
        };

        const langs = mapOptions(normalizeRef(langsRes, 'languages'));
        const genres = mapOptions(normalizeRef(genresRes, 'genres'));
        const categories = mapOptions(normalizeRef(categoriesRes, 'categories'));

        setLanguageOptions([{ value: '', label: 'Any' }, ...langs]);
        setGenreOptions([{ value: '', label: 'Any' }, ...genres]);
        setCategoryOptions([{ value: '', label: 'Any' }, ...categories]);
      } catch (err) {
        // fail silently; keep defaults
      }
    };
    loadReferences();
  }, []);

  useEffect(() => {
    if (!hasInteracted) return;
    const loadCatalog = async (offset = 0, append = false) => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const limit = 20;
        let games = [];
        
        // If both genre and category are selected, fetch from both and intersect
        if (filters.genreId && filters.categoryId) {
          const [genreRes, categoryRes] = await Promise.all([
            gameService.getGamesByGenre(filters.genreId, { 
              limit: 200, 
              offset: 0, 
              sortBy: filters.sortBy, 
              order: filters.order,
              languageId: filters.languageId || undefined
            }),
            gameService.getGamesByCategory(filters.categoryId, { 
              limit: 200, 
              offset: 0, 
              sortBy: filters.sortBy, 
              order: filters.order,
              languageId: filters.languageId || undefined
            })
          ]);
          
          const genreGames = normalizeGames(genreRes);
          const categoryGames = normalizeGames(categoryRes);
          
          // Create sets of app_ids for intersection
          const genreIds = new Set(genreGames.map(g => g.app_id || g.id || g.appId));
          const categoryIds = new Set(categoryGames.map(g => g.app_id || g.id || g.appId));
          
          // Find games that appear in both sets
          const intersectionIds = new Set([...genreIds].filter(id => categoryIds.has(id)));
          
          // Get the actual game objects (prefer genre results for consistency)
          games = genreGames.filter(g => {
            const id = g.app_id || g.id || g.appId;
            return intersectionIds.has(id);
          });
        } else if (filters.genreId) {
          // Use genre endpoint
          const params = {
            limit: 200, // Fetch more to account for client-side filtering
            offset: 0,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          if (filters.languageId) params.languageId = filters.languageId;
          const res = await gameService.getGamesByGenre(filters.genreId, params);
          games = normalizeGames(res);
        } else if (filters.categoryId) {
          // Use category endpoint
          const params = {
            limit: 200, // Fetch more to account for client-side filtering
            offset: 0,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          if (filters.languageId) params.languageId = filters.languageId;
          const res = await gameService.getGamesByCategory(filters.categoryId, params);
          games = normalizeGames(res);
        } else {
          // Use general games endpoint - supports platform, price, and language server-side
          const params = {
            limit: 200, // Fetch more to account for client-side filtering
            offset: 0,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          if (filters.platform) params.platform = filters.platform;
          if (filters.minPrice !== '') params.minPrice = Number(filters.minPrice);
          if (filters.maxPrice !== '') params.maxPrice = Number(filters.maxPrice);
          if (filters.languageId) params.languageId = filters.languageId;
          const res = await gameService.getGames(params);
          games = normalizeGames(res);
        }

        // Apply all client-side filters that weren't handled server-side
        let filteredGames = games.filter((g) => !isOwnedGame(g));
        
        // Filter by price (if not already filtered server-side)
        if ((filters.genreId || filters.categoryId) && (filters.minPrice !== '' || filters.maxPrice !== '')) {
          filteredGames = filteredGames.filter((g) => {
            const finalPrice = Number(g.final_price ?? g.price_final ?? g.price ?? 0);
            if (filters.minPrice !== '' && finalPrice < Number(filters.minPrice)) return false;
            if (filters.maxPrice !== '' && finalPrice > Number(filters.maxPrice)) return false;
            return true;
          });
        }
        
        // Filter by platform (if not already filtered server-side)
        if ((filters.genreId || filters.categoryId) && filters.platform) {
          filteredGames = filteredGames.filter((g) => {
            if (filters.platform === 'windows') return g.platforms_windows === true;
            if (filters.platform === 'mac') return g.platforms_mac === true;
            if (filters.platform === 'linux') return g.platforms_linux === true;
            return true;
          });
        }

        // Apply sorting (re-sort after filtering to ensure correct order)
        filteredGames.sort((a, b) => {
          const sortBy = filters.sortBy || 'name';
          const order = filters.order || 'ASC';
          let aVal = a[sortBy];
          let bVal = b[sortBy];
          
          // Handle numeric sorting
          if (sortBy === 'price_final' || sortBy === 'recommendations_total') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
          }
          
          if (order === 'ASC') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });

        // Cache all filtered games
        setAllFilteredGames(filteredGames);
        
        // Apply pagination client-side
        const paginatedGames = filteredGames.slice(offset, offset + limit);
        
        if (append) {
          setCatalog((prev) => [...prev, ...paginatedGames]);
        } else {
          setCatalog(paginatedGames);
        }
        
        setHasMoreGames(paginatedGames.length === limit && (offset + limit) < filteredGames.length);
        setCatalogOffset(offset);
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setCatalogError(apiError || 'Unable to load games');
        setHasMoreGames(false);
      } finally {
        setCatalogLoading(false);
      }
    };
    loadCatalog(0, false);
  }, [filters, isOwnedGame]);

  const heroItemsFromData = () => {
    const list = Array.isArray(recommended) ? recommended : [];
    return list.slice(0, 10).map((g, idx) => {
      const { discountPrice, originalPrice, discountPercent } = extractPrices(g);
      const badge = Number(g.discount_percent) > 0 ? 'hot' : 'cold';
      const releaseDate = formatDate(g.release_date || g.releaseDate || '');
      const ageLabel = g.required_age ? `${g.required_age}+` : '';
      const appId = g.app_id || g.appId || g.id || `hero-${idx}`;
      const id = g.id || g.appId || g.app_id || `hero-${idx}`;
      // Build meta badges with tone for colorful pills
      const metaBadges = [
        ...(releaseDate ? [{ text: releaseDate, tone: 'date' }] : []),
        ...(ageLabel ? [{ text: ageLabel, tone: 'age' }] : []),
      ];

      // Human-friendly meta string: "YYYY-MM-DD · Age"
      let metaString = '';
      if (releaseDate) metaString += releaseDate;
      if (ageLabel) metaString += (metaString ? ' · ' : '') + ageLabel;

      return {
        id,
        appId,
        badge,
        badgeLabel: badge === 'hot' ? 'Hot' : 'Pick',
        title: g.title || g.name || 'Untitled',
        subtitle: g.genre || g.category || '',
        releaseDate,
        ageLabel,
        originalPrice,
        discountPrice,
        discountPercent,
        metaBadges,    // array of { text, tone }
        metaString,    // single string ready to display near date
        image: g.image || g.header_image || g.thumbnail || '',
        raw: g,
      };
    });
  };

  const getBadgeStyle = (badgeText) => {
    if (!badgeText) return styles.pill;
    
    const text = String(badgeText).trim();
    
    // Price badges (starts with $)
    if (text.startsWith('$')) {
      return {
        ...styles.pill,
        background: '#dcfce7',
        color: '#166534',
        fontWeight: 600,
      };
    }
    
    // Age rating badges (ends with +)
    if (text.endsWith('+')) {
      return {
        ...styles.pill,
        background: '#fef3c7',
        color: '#92400e',
        fontWeight: 600,
      };
    }
    
    // Date badges (contains - or looks like YYYY-MM-DD)
    if (text.includes('-') || /^\d{4}/.test(text)) {
      return {
        ...styles.pill,
        background: '#dbeafe',
        color: '#1e40af',
        fontWeight: 500,
      };
    }
    
    // Default
    return styles.pill;
  };

  const cardGrid = (items) => (
    <div style={styles.cardGrid}>
      {items.map((g) => (
        <Link
          key={g.id || g.appId || `card-${g.title}`}
          to={g.appId ? `/game/${g.appId}` : g.id ? `/game/${g.id}` : '#'}
          style={styles.cardLink}
        >
          <div style={styles.card}>
            <div style={styles.cardImageWrap}>
              {g.appId && (
                <button
                  style={styles.heartButton}
                  aria-label="toggle wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleWishlist(g.appId);
                  }}
                >
                  <span
                    style={
                      wishlistIds.has(String(g.appId)) || wishlistIds.has(Number(g.appId))
                        ? styles.heartIconActive
                        : styles.heartIcon
                    }
                  >
                    ♥
                  </span>
                </button>
              )}
              <img src={g.image} alt={g.title} style={styles.cardImage} />
              {g.hasDiscount && g.discountPrice && (
                <div style={styles.cardBadge}>{g.discountPrice}</div>
              )}
            </div>
            <div style={styles.cardBody}>
              <div style={styles.cardTitle}>{g.title}</div>
              <div style={styles.cardPriceRow}>
                <span style={styles.priceCurrent}>
                  {g.hasDiscount ? g.discountPrice : g.basePrice || g.originalPrice || '—'}
                </span>
                {g.hasDiscount && g.originalPrice && (
                  <span style={styles.priceOriginal}>{g.originalPrice}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const popularItemsFromData = () => {
    const list = Array.isArray(featured) ? featured : [];
    return list.slice(0, 20).map((g, idx) => {
      const { discountPrice, originalPrice } = extractPrices(g);
      const releaseDate = formatDate(g.release_date || g.releaseDate || '');
      const ageLabel = g.required_age ? `${g.required_age}+` : '';

      const metaBadges = [
        ...(releaseDate ? [releaseDate] : []),
        ...(ageLabel ? [ageLabel] : []),
        ...(discountPrice ? [discountPrice] : originalPrice ? [originalPrice] : []),
      ];

      return {
        id: g.id || g.appId || `popular-${idx}`,
        title: g.title || g.name || 'Untitled',
        subtitle: g.genre || g.category || '',
        image: g.image || g.header_image || g.thumbnail || '',
        metaBadges,
      };
    });
  };

  const catalogItemsFromData = () => {
    const list = Array.isArray(catalog) ? catalog : [];
    return list.map((g, idx) => {
      const { discountPrice, originalPrice, hasDiscount, base } = extractPrices(g);
      const id = g.id || g.appId || g.app_id || `catalog-${idx}`;
      const appId = g.app_id || g.appId || g.id;

      return {
        id,
        appId,
        title: g.title || g.name || 'Untitled',
        image: g.image || g.header_image || g.thumbnail || '',
        hasDiscount,
        discountPrice,
        originalPrice,
        basePrice: base,
      };
    });
  };

  const platformOptions = [
    { value: '', label: 'Any' },
    { value: 'windows', label: 'Windows' },
    { value: 'mac', label: 'Mac' },
    { value: 'linux', label: 'Linux' },
  ];

  const handleFilterChange = (key, value) => {
    setHasInteracted(true);
    setCatalogOffset(0);
    setHasMoreGames(true);
    setAllFilteredGames([]); // Clear cache when filters change
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadMoreGames = useCallback(() => {
    if (catalogLoading || !hasMoreGames || isLoadingMore) return;
    const nextOffset = catalogOffset + 20;
    setIsLoadingMore(true);
    
    // Use cached filtered games for pagination
    const limit = 20;
    const paginatedGames = allFilteredGames.slice(nextOffset, nextOffset + limit);
    
    if (paginatedGames.length > 0) {
      setCatalog((prev) => [...prev, ...paginatedGames]);
      setHasMoreGames(nextOffset + limit < allFilteredGames.length);
      setCatalogOffset(nextOffset);
    } else {
      setHasMoreGames(false);
    }
    
    setIsLoadingMore(false);
  }, [catalogLoading, hasMoreGames, catalogOffset, allFilteredGames, isLoadingMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (catalogLoading || !hasMoreGames || isLoadingMore) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 200px from bottom
      if (scrollTop + windowHeight >= docHeight - 200) {
        loadMoreGames();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [catalogLoading, hasMoreGames, loadMoreGames, isLoadingMore]);

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <main style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Featured & Trending</h1>
          </div>
        </div>
        {gamesError && <div style={styles.error}>{gamesError}</div>}
        {gamesLoading && <div style={styles.badge}>Loading...</div>}
        {heroItemsFromData().length > 0 && (
          <HeroCarousel
            items={heroItemsFromData()}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            isAuthed={isAuthenticated}
          />
        )}

        {featured.length > 0 && (
          <section style={styles.featuredSection}>
            <h2 style={styles.featuredTitle}>Featured Games</h2>
            <div style={styles.featuredScroll}>
              {featured.slice(0, 12).map((g) => {
                const { discountPrice, originalPrice, hasDiscount } = extractPrices(g);
                const appId = g.app_id || g.appId || g.id;
                return (
                  <Link key={appId || g.id || `feat-${g.title}`} to={appId ? `/game/${appId}` : '#'} style={styles.cardLink}>
                    <div style={styles.featuredCard}>
                      <div style={styles.featuredImageWrap}>
                        {appId && (
                          <button
                            style={styles.heartButton}
                            aria-label="toggle wishlist"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleWishlist(appId);
                            }}
                          >
                            <span
                              style={
                                wishlistIds.has(String(appId)) || wishlistIds.has(Number(appId))
                                  ? styles.heartIconActive
                                  : styles.heartIcon
                              }
                            >
                              ♥
                            </span>
                          </button>
                        )}
                        <img
                          src={g.image || g.header_image || g.thumbnail || ''}
                          alt={g.title || g.name || 'Game'}
                          style={styles.featuredImage}
                        />
                        {hasDiscount && discountPrice && (
                          <div style={styles.priceBadge}>{discountPrice}</div>
                        )}
                      </div>
                      <div style={styles.featuredCardBody}>
                        <div style={styles.featuredCardTitle}>{g.title || g.name || 'Untitled'}</div>
                        {!hasDiscount && originalPrice && (
                          <div style={styles.featuredPrice}>{originalPrice}</div>
                        )}
                        {hasDiscount && originalPrice && (
                          <div style={styles.featuredPriceStrikethrough}>{originalPrice}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section style={styles.catalogSection}>
          <div style={styles.catalogControlBar}>
            <h2 style={styles.catalogTitle}>All Games</h2>
          </div>

          <div style={styles.twoColumnLayout}>
            {/* Left Column: Filters */}
            <div style={styles.filterColumn}>
              <div style={styles.filterCard}>
                <h3 style={styles.filterCardTitle}>Filter & Sort</h3>
                <div style={styles.filterColumnContent}>
                  <div style={styles.filterBarGroup}>
                    <label style={styles.filterLabel}>Platform</label>
                    <CustomDropdown
                      options={platformOptions}
                      value={filters.platform}
                      onChange={(val) => handleFilterChange('platform', val)}
                    />
                  </div>

                  <div style={styles.filterBarGroup}>
                    <label style={styles.filterLabel}>Genres</label>
                    <CustomDropdown
                      options={genreOptions}
                      value={filters.genreId}
                      onChange={(val) => handleFilterChange('genreId', val)}
                    />
                  </div>

                  <div style={styles.filterBarGroup}>
                    <label style={styles.filterLabel}>Categories</label>
                    <CustomDropdown
                      options={categoryOptions}
                      value={filters.categoryId}
                      onChange={(val) => handleFilterChange('categoryId', val)}
                    />
                  </div>

                  <div style={styles.filterBarGroup}>
                    <label style={styles.filterLabel}>Languages</label>
                    <CustomDropdown
                      options={languageOptions}
                      value={filters.languageId}
                      onChange={(val) => handleFilterChange('languageId', val)}
                    />
                  </div>

                  <div style={styles.filterBarGroup}>
                    <div style={styles.priceBox}>
                      <div style={styles.priceBoxHeader}>Price range & sort</div>
                      <div style={styles.priceControls}>
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          style={styles.input}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.priceActions}>
                        <div style={styles.radioRow}>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="priceOrder"
                              value="ASC"
                              checked={priceOrder === 'ASC'}
                              onChange={(e) => setPriceOrder(e.target.value)}
                            />
                            Asc
                          </label>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="priceOrder"
                              value="DESC"
                              checked={priceOrder === 'DESC'}
                              onChange={(e) => setPriceOrder(e.target.value)}
                            />
                            Desc
                          </label>
                        </div>
                        <div style={styles.priceButtons}>
                          <button
                            style={styles.secondaryButton}
                            onClick={() => {
                              setHasInteracted(true);
                              setCatalogOffset(0);
                              setHasMoreGames(true);
                              setAllFilteredGames([]);
                              setFilters({
                                sortBy: 'price_final',
                                order: 'ASC',
                                platform: '',
                                minPrice: '',
                                maxPrice: '',
                                genreId: '',
                                categoryId: '',
                                languageId: '',
                              });
                              setPriceOrder('ASC');
                            }}
                          >
                            Clear
                          </button>
                          <button
                            style={styles.applyButton}
                            onClick={() => {
                              setHasInteracted(true);
                              setCatalogOffset(0);
                              setHasMoreGames(true);
                              setAllFilteredGames([]);
                              setFilters((prev) => ({
                                ...prev,
                                sortBy: 'price_final',
                                order: priceOrder,
                              }));
                            }}
                          >
                            Sort by price
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Games */}
            <div style={styles.gamesColumn}>
              <div style={styles.catalogPane}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Games</h2>
                  {catalogLoading && <span style={styles.badge}>Loading...</span>}
                  {catalogError && <span style={styles.error}>{catalogError}</span>}
                  {!catalogLoading && !catalogError && !hasInteracted && featuredLoading && (
                    <span style={styles.badge}>Loading...</span>
                  )}
                  {!catalogLoading && !catalogError && !hasInteracted && featuredError && (
                    <span style={styles.error}>{featuredError}</span>
                  )}
                </div>
                {catalogItemsFromData().length > 0 && cardGrid(catalogItemsFromData())}
                {isLoadingMore && (
                  <div style={styles.loadingMore}>Loading more games...</div>
                )}
                {!catalogLoading && !catalogError && catalogItemsFromData().length === 0 && (
                  <div style={styles.badge}>No games found.</div>
                )}
                {!hasMoreGames && catalogItemsFromData().length > 0 && (
                  <div style={styles.endMessage}>No more games to load.</div>
                )}
              </div>
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
    padding: '20px 22px 48px',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    minHeight: 'calc(100vh - 72px)',
    fontFamily: "'Manrope', sans-serif",
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
    fontSize: '28px',
    color: '#215122',
    letterSpacing: '0.2px',
    fontFamily: "'Fraunces', serif",
  },
  subheading: {
    margin: '6px 0 0',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '14px',
  },
  button: {
    height: '42px',
    padding: '0 18px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #215122, #748772)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(33,81,34,0.2)',
  },
  badge: {
    fontSize: '12px',
    color: 'rgba(33, 81, 34, 0.65)',
  },
  section: {
    marginTop: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  error: {
    fontSize: '12px',
    color: '#8b1d22',
  },

  /* card styles (used by cardGrid) */
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '14px',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  card: {
    background: '#fff',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    boxShadow: '0 8px 18px rgba(33,81,34,0.08)',
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    height: '140px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: '12px',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '15px',
    color: '#1c231f',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardPriceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  priceCurrent: {
    color: '#215122',
    fontWeight: 700,
    fontSize: '14px',
  },
  priceOriginal: {
    color: 'rgba(33, 81, 34, 0.5)',
    textDecoration: 'line-through',
    fontSize: '13px',
    fontWeight: 400,
  },
  cardBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: '#e02e35',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    boxShadow: '0 6px 14px rgba(224,46,53,0.25)',
  },
  heartButton: {
    position: 'absolute',
    top: '12px',
    left: '10px',
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(33, 81, 34, 0.18)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 3,
    boxShadow: '0 10px 20px rgba(33,81,34,0.14)',
  },
  heartIcon: {
    color: '#8fa094',
    fontSize: '18px',
  },
  heartIconActive: {
    color: '#e02e35',
    fontSize: '18px',
  },
  catalogSection: {
    marginTop: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  filterColumn: {
    position: 'sticky',
    top: '20px',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  },
  filterCard: {
    background: '#f2f0e9',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    boxShadow: '0 10px 24px rgba(33,81,34,0.08)',
  },
  filterCardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#215122',
    paddingBottom: '12px',
    borderBottom: '1px dashed rgba(33, 81, 34, 0.25)',
    fontFamily: "'Fraunces', serif",
  },
  filterColumnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterBarGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gamesColumn: {
    minWidth: 0,
  },
  filterLabel: {
    fontSize: '13px',
    color: 'rgba(33, 81, 34, 0.7)',
    fontWeight: 600,
  },
  select: {
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    color: '#111827',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    paddingRight: '30px',
  },
  selectAccent: {
    padding: '8px 32px 8px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(33, 81, 34, 0.25)',
    fontSize: '13px',
    color: '#1c231f',
    background: '#f7f4ef',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23215122'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    boxShadow: '0 1px 2px rgba(33,81,34,0.08)',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    MozAppearance: 'none',
    paddingRight: '30px',
  },
  radioRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  radioLabel: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#324035',
  },
  priceBox: {
    border: '1px solid rgba(33, 81, 34, 0.2)',
    borderRadius: '12px',
    background: '#f7f4ef',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  priceBoxHeader: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  priceControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  priceActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    width: '100%',
  },
  applyButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #215122, #748772)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(33,81,34,0.2)',
  },
  priceButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  secondaryButton: {
    border: '1px solid rgba(33, 81, 34, 0.2)',
    background: '#fff',
    color: '#324035',
    padding: '8px 12px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    fontSize: '13px',
    color: '#1c231f',
    boxSizing: 'border-box',
    background: '#fff',
  },
  checkboxLabel: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#374151',
  },
  clearButton: {
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    color: '#374151',
    fontWeight: 600,
    justifySelf: 'end',
  },
  catalogPane: {
    background: '#fff',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    boxShadow: '0 10px 24px rgba(33,81,34,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featuredSection: {
    marginTop: '32px',
    marginBottom: '32px',
  },
  featuredTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  featuredScroll: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
  },
  featuredCard: {
    flex: '0 0 180px',
    background: '#fff',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    boxShadow: '0 6px 14px rgba(33,81,34,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  featuredImageWrap: {
    position: 'relative',
    width: '100%',
    height: '100px',
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  priceBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#e02e35',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    boxShadow: '0 4px 10px rgba(224,46,53,0.35)',
  },
  featuredCardBody: {
    padding: '10px',
  },
  featuredCardTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#1c231f',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  featuredPrice: {
    fontSize: '12px',
    color: '#215122',
    fontWeight: 700,
  },
  featuredPriceStrikethrough: {
    fontSize: '11px',
    color: 'rgba(33, 81, 34, 0.5)',
    fontWeight: 400,
    textDecoration: 'line-through',
  },
  catalogControlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed rgba(33, 81, 34, 0.25)',
    marginBottom: '12px',
  },
  catalogTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  loadingMore: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
    color: 'rgba(33, 81, 34, 0.7)',
  },
  endMessage: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
    color: 'rgba(33, 81, 34, 0.55)',
    fontStyle: 'italic',
  },
};
