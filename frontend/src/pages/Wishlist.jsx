import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useWishlist } from '../context/WishlistContext';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();

  const normalized = useMemo(() => {
    return (wishlist || []).map((g, idx) => ({
      id: g.id || g.app_id || g.appId || idx,
      appId: g.app_id || g.appId || g.id,
      title: g.title || g.name || 'Untitled',
      image: g.image || g.header_image || g.thumbnail || '',
      price:
        g.final_price ||
        g.price_final ||
        g.discount_price ||
        g.price_after_discount ||
        g.price ||
        '',
      original: g.original_price || g.price_org || '',
    }));
  }, [wishlist]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    const str = String(val).trim();
    if (!str) return '';
    return str.startsWith('$') ? str : `$${str}`;
  };

  return (
    <>
      <Navbar />
      <main className="wishlist-page">
        <div className="wishlist-shell">
          <div className="wishlist-header">
            <div>
              <h1 className="wishlist-title">Wishlist</h1>
              <p className="wishlist-subtitle">
                Save games you're excited to play next.
              </p>
            </div>
            <div className="wishlist-accent" aria-hidden="true" />
          </div>

          {loading ? (
            <div className="wishlist-message">Loading wishlist...</div>
          ) : normalized.length === 0 ? (
            <div className="wishlist-empty">Your wishlist is empty</div>
          ) : (
            <div className="wishlist-list">
              {normalized.map((g, index) => (
                <div
                  key={g.id}
                  className="wishlist-card"
                  style={{ '--delay': `${index * 80}ms` }}
                >
                  <Link
                    to={g.appId ? `/game/${g.appId}` : '#'}
                    className="wishlist-thumb"
                  >
                    <img
                      src={g.image || '/placeholder-game.jpg'}
                      alt={g.title}
                      className="wishlist-thumb-image"
                      onError={(e) => {
                        e.target.src = '/placeholder-game.jpg';
                      }}
                    />
                  </Link>
                  <div className="wishlist-info">
                    <Link
                      to={g.appId ? `/game/${g.appId}` : '#'}
                      className="wishlist-name"
                    >
                      {g.title}
                    </Link>
                    <div className="wishlist-price">
                      <span className="wishlist-price-current">
                        {formatPrice(g.price) || 'N/A'}
                      </span>
                      {g.original &&
                        formatPrice(g.original) !== formatPrice(g.price) && (
                          <span className="wishlist-price-original">
                            {formatPrice(g.original)}
                          </span>
                        )}
                    </div>
                  </div>
                  <button
                    className="wishlist-remove"
                    onClick={() => removeFromWishlist(g.appId || g.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Wishlist;
