import React from 'react';
import GameCard from './GameCard';
import './Weekly.css';

const WeeklySale = ({ items }) => {
  return (
    <section className="weekly">
      <div className="weekly__header">
        <h3>Weekly Sale</h3>
      </div>
      <div className="weekly__grid">
        {items.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
};

export default WeeklySale;
