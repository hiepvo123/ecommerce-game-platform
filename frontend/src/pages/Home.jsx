import React, { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import HeroCarousel from '../components/layout/HeroCarousel';
import { gameService } from '../services/gameService';
import { referenceService } from '../services/referenceService';
import { useAuth } from '../context/AuthContext';

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
  const { logout } = useAuth();
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
  const [showFilters, setShowFilters] = useState(false);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
        setFeatured(games.slice(0, 20));
        if (!hasInteracted) {
          setCatalog(games.slice(0, 20));
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
  }, [hasInteracted]);

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
        let res;
        
        // Determine which endpoint to use based on filters
        if (filters.genreId) {
          // Use genre endpoint - it supports sortBy, order, limit, offset
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          res = await gameService.getGamesByGenre(filters.genreId, params);
        } else if (filters.categoryId) {
          // Use category endpoint
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          res = await gameService.getGamesByCategory(filters.categoryId, params);
        } else {
          // Use general games endpoint
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          if (filters.platform) params.platform = filters.platform;
          if (filters.minPrice !== '') params.minPrice = Number(filters.minPrice);
          if (filters.maxPrice !== '') params.maxPrice = Number(filters.maxPrice);
          res = await gameService.getGames(params);
        }

        const games = normalizeGames(res);
        
        // Filter by price if using genre/category endpoints (they don't support price filters)
        let filteredGames = games;
        if ((filters.genreId || filters.categoryId) && (filters.minPrice !== '' || filters.maxPrice !== '')) {
          filteredGames = games.filter((g) => {
            const finalPrice = Number(g.final_price ?? g.price_final ?? g.price ?? 0);
            if (filters.minPrice !== '' && finalPrice < Number(filters.minPrice)) return false;
            if (filters.maxPrice !== '' && finalPrice > Number(filters.maxPrice)) return false;
            return true;
          });
        }

        // Filter by platform if using genre/category endpoints
        if ((filters.genreId || filters.categoryId) && filters.platform) {
          filteredGames = filteredGames.filter((g) => {
            if (filters.platform === 'windows') return g.platforms_windows === true;
            if (filters.platform === 'mac') return g.platforms_mac === true;
            if (filters.platform === 'linux') return g.platforms_linux === true;
            return true;
          });
        }

        if (append) {
          setCatalog((prev) => [...prev, ...filteredGames]);
        } else {
          setCatalog(filteredGames);
        }
        
        setHasMoreGames(filteredGames.length === limit);
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
  }, [filters]);

  const heroItemsFromData = () => {
    const list = Array.isArray(recommended) ? recommended : [];
    return list.slice(0, 10).map((g, idx) => {
      const { discountPrice, originalPrice, discountPercent } = extractPrices(g);
      const badge = Number(g.discount_percent) > 0 ? 'hot' : 'cold';
      const releaseDate = formatDate(g.release_date || g.releaseDate || '');
      const ageLabel = g.required_age ? `${g.required_age}+` : '';
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
        id: g.id || g.appId || idx,
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

  const cardGrid = (items) => (
    <div style={styles.cardGrid}>
      {items.map((g) => (
        <div key={g.id} style={styles.card}>
          <div style={styles.cardImageWrap}>
            <img src={g.image} alt={g.title} style={styles.cardImage} />
          </div>
          <div style={styles.cardBody}>
            <div style={styles.pillRow}>
              {g.metaBadges && g.metaBadges.length > 0 && g.metaBadges.map((p, i) => (
                <span key={i} style={styles.pill}>{p}</span>
              ))}
            </div>
            <div style={styles.cardTitle}>{g.title}</div>
          </div>
        </div>
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
      const { discountPrice, originalPrice } = extractPrices(g);
      const releaseDate = formatDate(g.release_date || g.releaseDate || '');
      const ageLabel = g.required_age ? `${g.required_age}+` : '';

      const metaBadges = [
        ...(releaseDate ? [releaseDate] : []),
        ...(ageLabel ? [ageLabel] : []),
        ...(discountPrice ? [discountPrice] : originalPrice ? [originalPrice] : []),
      ];

      return {
        id: g.id || g.appId || `catalog-${idx}`,
        title: g.title || g.name || 'Untitled',
        subtitle: g.genre || g.category || '',
        image: g.image || g.header_image || g.thumbnail || '',
        metaBadges,
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
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadMoreGames = useCallback(() => {
    if (catalogLoading || !hasMoreGames || isLoadingMore) return;
    const nextOffset = catalogOffset + 20;
    setIsLoadingMore(true);
    const loadCatalog = async (offset = 0, append = false) => {
      if (!append) setCatalogLoading(true);
      setCatalogError('');
      try {
        const limit = 20;
        let res;
        
        if (filters.genreId) {
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          res = await gameService.getGamesByGenre(filters.genreId, params);
        } else if (filters.categoryId) {
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          res = await gameService.getGamesByCategory(filters.categoryId, params);
        } else {
          const params = {
            limit,
            offset,
            sortBy: filters.sortBy,
            order: filters.order,
          };
          if (filters.platform) params.platform = filters.platform;
          if (filters.minPrice !== '') params.minPrice = Number(filters.minPrice);
          if (filters.maxPrice !== '') params.maxPrice = Number(filters.maxPrice);
          res = await gameService.getGames(params);
        }

        const games = normalizeGames(res);
        
        let filteredGames = games;
        if ((filters.genreId || filters.categoryId) && (filters.minPrice !== '' || filters.maxPrice !== '')) {
          filteredGames = games.filter((g) => {
            const finalPrice = Number(g.final_price ?? g.price_final ?? g.price ?? 0);
            if (filters.minPrice !== '' && finalPrice < Number(filters.minPrice)) return false;
            if (filters.maxPrice !== '' && finalPrice > Number(filters.maxPrice)) return false;
            return true;
          });
        }

        if ((filters.genreId || filters.categoryId) && filters.platform) {
          filteredGames = filteredGames.filter((g) => {
            if (filters.platform === 'windows') return g.platforms_windows === true;
            if (filters.platform === 'mac') return g.platforms_mac === true;
            if (filters.platform === 'linux') return g.platforms_linux === true;
            return true;
          });
        }

        if (append) {
          setCatalog((prev) => [...prev, ...filteredGames]);
        } else {
          setCatalog(filteredGames);
        }
        
        setHasMoreGames(filteredGames.length === limit);
        setCatalogOffset(offset);
      } catch (err) {
        const apiError =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message;
        setCatalogError(apiError || 'Unable to load games');
        setHasMoreGames(false);
      } finally {
        if (!append) setCatalogLoading(false);
        setIsLoadingMore(false);
      }
    };
    loadCatalog(nextOffset, true);
  }, [catalogLoading, hasMoreGames, catalogOffset, filters, isLoadingMore]);

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
      <main style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Featured & Trending</h1>
          </div>
        </div>
        {gamesError && <div style={styles.error}>{gamesError}</div>}
        {gamesLoading && <div style={styles.badge}>Loading...</div>}
        {heroItemsFromData().length > 0 && <HeroCarousel items={heroItemsFromData()} />}

        {featured.length > 0 && (
          <section style={styles.featuredSection}>
            <h2 style={styles.featuredTitle}>Featured Games</h2>
            <div style={styles.featuredScroll}>
              {featured.slice(0, 12).map((g) => {
                const { discountPrice, originalPrice, hasDiscount } = extractPrices(g);
                return (
                  <div key={g.id || g.appId} style={styles.featuredCard}>
                    <div style={styles.featuredImageWrap}>
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
                );
              })}
            </div>
          </section>
        )}

        <section style={styles.catalogSection}>
          <div style={styles.catalogControlBar}>
            <h2 style={styles.catalogTitle}>All Games</h2>
            <button
              style={styles.filterToggleButton}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter & Sort {showFilters ? '▼' : '▶'}
            </button>
          </div>

          {showFilters && (
          <div style={styles.filterBar}>
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

            <div style={styles.filterBarGroup} data-wide>
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
          )}

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
  badge: {
    fontSize: '12px',
    color: '#6b7280',
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
    color: '#111827',
  },
  error: {
    fontSize: '12px',
    color: '#b91c1c',
  },

  /* card styles (used by cardGrid) */
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '12px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
  },
  cardImageWrap: {
    width: '100%',
    height: '120px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: '10px',
  },
  pillRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  pill: {
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    color: '#475569',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#0f172a',
  },
  catalogSection: {
    marginTop: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  filterBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(200px, 1fr)) minmax(340px, 1fr)',
    gap: '10px',
    background: '#fff',
    padding: '12px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
    alignItems: 'center',
  },
  filterBarGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '13px',
    color: '#4b5563',
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
    border: '1px solid #bfdbfe',
    fontSize: '13px',
    color: '#0f172a',
    background: '#eff6ff',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
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
    color: '#374151',
  },
  priceBox: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: '#f8fafc',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  priceBoxHeader: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
  },
  priceControls: {
    display: 'flex',
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
    background: '#3b82f6',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
  },
  priceButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  secondaryButton: {
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    color: '#374151',
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: '0 0 140px',
    padding: '8px 8px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#111827',
    minWidth: 0,
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
    padding: '14px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
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
    color: '#111827',
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
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(17,24,39,0.08)',
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
    background: '#ef4444',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
  },
  featuredCardBody: {
    padding: '10px',
  },
  featuredCardTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#0f172a',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  featuredPrice: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  featuredPriceStrikethrough: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 400,
    textDecoration: 'line-through',
  },
  catalogControlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '12px',
  },
  catalogTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  filterToggleButton: {
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background 0.2s ease',
  },
  loadingMore: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
    color: '#6b7280',
  },
  endMessage: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};
