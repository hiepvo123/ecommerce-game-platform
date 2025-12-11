import React, { useRef } from 'react';
import './HeroCarousel.css';

const HeroCarousel = ({ items }) => {
  const trackRef = useRef(null);

  const scrollByCards = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.hero__card');
    const cardWidth = card ? card.getBoundingClientRect().width : 300;
    const delta = dir === 'left' ? -cardWidth * 1.1 : cardWidth * 1.1;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <button className="hero__arrow hero__arrow--left" onClick={() => scrollByCards('left')}>
        {'<'}
      </button>
      <div className="hero__track" ref={trackRef}>
        {items.map((item) => (
          <div className="hero__card" key={item.id}>
            <span className={`hero__badge hero__badge--${item.badge || 'hot'}`}>
              {item.badgeLabel}
            </span>
            {item.discountPercent > 0 && (
              <span className="hero__discount">{`-${item.discountPercent}%`}</span>
            )}
            <img src={item.image} alt={item.title} />
            <div className="hero__info">
              <div className="hero__meta">
                {(item.metaBadges || []).map((badge, i) => {
                  const text = typeof badge === 'string' ? badge : badge?.text;
                  const tone = typeof badge === 'string' ? '' : badge?.tone || '';
                  return (
                    text && (
                      <span key={i} className={`hero__pill ${tone ? `hero__pill--${tone}` : ''}`}>
                        {text}
                      </span>
                    )
                  );
                })}
              </div>
              <p className="hero__title">{item.title}</p>
              {item.subtitle && <p className="hero__subtitle">{item.subtitle}</p>}
              <div className="hero__price-row">
                <span className="hero__price hero__price--final">
                  {item.discountPrice || item.originalPrice}
                </span>
                {item.discountPrice && item.originalPrice && item.discountPrice !== item.originalPrice && (
                  <span className="hero__price hero__price--strike">{item.originalPrice}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="hero__arrow hero__arrow--right" onClick={() => scrollByCards('right')}>
        {'>'}
      </button>
    </section>
  );
};

export default HeroCarousel;
