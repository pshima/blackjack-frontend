import React from 'react';
import type { Card as CardType } from '../../types/cardgame';
import { getCardName, getSuitName, getRankName } from '../../types/cardgame';

interface CardProps {
  card: CardType;
  size?: 'small' | 'large' | 'icon';
  className?: string;
  showBack?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  size = 'small', 
  className = '', 
  showBack = false 
}) => {
  const cardImage = card.images?.[size];
  const isVisible = card.face_up && !showBack;
  const shouldShowBack = !card.face_up || showBack;
  
  return (
    <div 
      className={`
        relative inline-block rounded-lg shadow-lg transition-all duration-300 
        hover:scale-105 hover:shadow-xl
        ${className}
      `}
      title={isVisible ? `${getRankName(card.rank)} of ${getSuitName(card.suit)}` : 'Hidden card'}
    >
      {cardImage ? (
        <img
          src={cardImage}
          alt={isVisible ? getCardName(card) : 'Hidden card'}
          className="rounded-lg"
          loading="lazy"
          onError={(e) => {
            // Fallback to text representation if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback text representation */}
      <div 
        className={`
          ${cardImage ? 'hidden' : 'flex'}
          items-center justify-center bg-white border-2 border-gray-300 rounded-lg
          ${size === 'icon' ? 'w-8 h-12 text-xs' : ''}
          ${size === 'small' ? 'w-16 h-24 text-sm' : ''}
          ${size === 'large' ? 'w-32 h-48 text-lg' : ''}
          ${shouldShowBack ? 'bg-blue-800 border-blue-600' : ''}
        `}
      >
        {isVisible ? (
          <span className={`font-bold ${getSuitColor(card.suit)}`}>
            {getCardName(card)}
          </span>
        ) : (
          <div className="text-white text-center">
            <div className="text-xs mb-1">🂠</div>
            <div className="text-xs">CARD</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get suit color
function getSuitColor(suit: number): string {
  // Hearts and Diamonds are red, Clubs and Spades are black
  return suit === 0 || suit === 1 ? 'text-red-600' : 'text-black';
}

export default Card;