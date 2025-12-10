import React from 'react';
import './Weekly.css';

const GameCard = ({ game }) => {
  return (
    <div className="game-card">
      <img src={game.image} alt={game.title} />
      <div className="game-card__body">
        <div className="game-card__badges">
          <span className="badge badge--promo">{game.promo}</span>
          <span className="badge badge--date">{game.date}</span>
          <span className="badge badge--type">{game.type}</span>
        </div>
        <h4 className="game-card__title">{game.title}</h4>
        <p className="game-card__desc">{game.description}</p>
        <div className="game-card__footer">
          {game.originalPrice && (
            <span className="game-card__original">{game.originalPrice}</span>
          )}
          <span className="game-card__price">{game.price}</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
