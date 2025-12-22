import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { gameService } from '../../services/gameService';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, loading, user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestedGames, setSuggestedGames] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.trim().toLowerCase();
      
      // Check cache first
      if (cacheRef.current.has(query)) {
        const cached = cacheRef.current.get(query);
        setSuggestedGames(cached.games);
        setSearchSuggestions(cached.suggestions);
        setShowDropdown(true);
        setIsSearching(false);
        return;
      }

      // Show loading immediately
      setIsSearching(true);
      setShowDropdown(true);

      const debounceTimer = setTimeout(() => {
        fetchSearchResults(query);
      }, 150);

      return () => {
        clearTimeout(debounceTimer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setSuggestedGames([]);
      setSearchSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchSearchResults = async (query) => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // Use fast autocomplete endpoint for dropdown
      const response = await gameService.searchGamesAutocomplete(query, {
        limit: 3,
        offset: 0
      }, signal);
      
      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      const games = response.data?.games || response.games || [];
      const suggestions = generateSearchSuggestions(query, games);
      
      // Cache results
      cacheRef.current.set(query, { games, suggestions });
      // Limit cache size to 20 entries
      if (cacheRef.current.size > 20) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setSuggestedGames(games);
      setSearchSuggestions(suggestions);
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Search error:', err);
      if (!signal.aborted) {
        setSuggestedGames([]);
        setSearchSuggestions([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  const generateSearchSuggestions = (query, games) => {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Add the exact query as first suggestion
    suggestions.push(query);
    
    // Extract unique game names that contain the query
    const gameNames = games
      .map(g => g.name)
      .filter(name => name && name.toLowerCase().includes(queryLower))
      .slice(0, 4);
    
    gameNames.forEach(name => {
      if (!suggestions.includes(name)) {
        suggestions.push(name);
      }
    });
    
    return suggestions.slice(0, 5);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowDropdown(false);
  };

  const handleGameClick = (appId) => {
    navigate(`/game/${appId}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowDropdown(false);
    setSuggestedGames([]);
    setSearchSuggestions([]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <header className="nav">
      <div className="nav__logo" onClick={() => navigate(isAdmin ? '/admin' : '/')}>GameHub</div>

      <nav className="nav__links">
        {isAdmin ? (
          <>
            <button className="nav__link" onClick={() => navigate('/admin/orders')}>All Orders</button>
            <button className="nav__link" onClick={() => navigate('/admin/users')}>All Users</button>
            <button className="nav__link" onClick={() => navigate('/admin/games')}>All Games</button>
          </>
        ) : (
          <>
            <button className="nav__link" onClick={() => navigate('/')}>Store</button>
            <button className="nav__link" onClick={() => navigate('/library')}>Library</button>
            <div className="nav__search-wrapper" ref={searchRef}>
          <form className="nav__search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="nav__search-input"
              placeholder="Search Games 🔍"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="nav__search-clear"
                onClick={handleClearSearch}
              >
                ✕
              </button>
            )}
          </form>
          
          {showDropdown && (
            <div className="nav__search-dropdown" ref={dropdownRef}>
              <div className="nav__dropdown-arrow"></div>
              
              {isSearching ? (
                <div className="nav__dropdown-loading">Searching...</div>
              ) : (
                <>
                  {searchSuggestions.length > 0 && (
                    <div className="nav__dropdown-section">
                      <div className="nav__dropdown-title">Did you mean to search for</div>
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="nav__dropdown-suggestion"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {suggestedGames.length > 0 && (
                    <div className="nav__dropdown-section">
                      <div className="nav__dropdown-title">Suggested Games</div>
                      {suggestedGames.map((game) => (
                        <div
                          key={game.app_id}
                          className="nav__dropdown-game"
                          onClick={() => handleGameClick(game.app_id)}
                        >
                          <img
                            src={game.header_image || '/placeholder-game.jpg'}
                            alt={game.name}
                            className="nav__dropdown-game-image"
                            onError={(e) => {
                              e.target.src = '/placeholder-game.jpg';
                            }}
                          />
                          <div className="nav__dropdown-game-info">
                            <div className="nav__dropdown-game-name">{game.name}</div>
                            <div className="nav__dropdown-game-price">
                              {game.discount_percent > 0 && (
                                <>
                                  <span className="nav__dropdown-original-price">
                                    ${parseFloat(game.price_final / (1 - game.discount_percent / 100)).toFixed(2)}
                                  </span>
                                  <span className="nav__dropdown-discount">-{game.discount_percent}%</span>
                                </>
                              )}
                              <span className="nav__dropdown-final-price">
                                {formatPrice(game.price_final)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!isSearching && searchSuggestions.length === 0 && suggestedGames.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="nav__dropdown-empty">No results found</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </nav>

      <div className="nav__actions">
        {!loading && (
          isAuthenticated ? (
            <>
              {!isAdmin && (
                <>
                  <button className="nav__action-btn" onClick={() => navigate('/wishlist')}>

                    <span className="nav__action-text">Wishlist</span>
                  </button>
                  <button className="nav__action-btn nav__cart-btn" onClick={() => navigate('/cart')}>

                    <span className="nav__action-text">Cart</span>
                    {cartCount > 0 && (
                      <span className="nav__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                    )}
                  </button>
                  <button className="nav__action-btn" onClick={() => navigate('/orders')}>

                    <span className="nav__action-text">Orders</span>
                  </button>
                  <button className="nav__action-btn" onClick={() => navigate('/profile')}>
                    <span className="nav__action-icon">👤</span>
                    <span className="nav__action-text">Profile</span>
                  </button>
                </>
              )}
              <button className="nav__logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <a className="nav__login" href="/login">Login</a>
            </>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;
