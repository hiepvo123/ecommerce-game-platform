import React from 'react';
import './HeroCarousel.css';

const HeroCarousel = ({ items }) => {
  return (
    <section className="hero">
      <button className="hero__arrow hero__arrow--left">{'<'}</button>
      <div className="hero__track">
        {items.map((item) => (
          <div className="hero__card" key={item.id}>
            <span className={`hero__badge hero__badge--${item.badge || 'hot'}`}>
              {item.badgeLabel}
            </span>
            <img src={item.image} alt={item.title} />
            <div className="hero__info">
              <p className="hero__title">{item.title}</p>
              <p className="hero__subtitle">{item.subtitle}</p>
              <p className="hero__price">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="hero__arrow hero__arrow--right">{'>'}</button>
    </section>
  );
};

export default HeroCarousel;
