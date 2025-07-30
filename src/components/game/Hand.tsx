import React from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../../types/cardgame';

interface HandProps {
  cards: CardType[];
  title: string;
  handValue?: number;
  isDealer?: boolean;
  hideFirstCard?: boolean;
  className?: string;
}

export const Hand: React.FC<HandProps> = ({
  cards,
  title,
  handValue,
  isDealer = false,
  hideFirstCard = false,
  className = ''
}) => {
  const hasBlackjack = handValue === 21 && cards.length === 2;
  const isBusted = handValue !== undefined && handValue > 21;

  return (
    <div className={`text-center ${className}`}>
      {/* Hand Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        
        {/* Hand Value Display */}
        {handValue !== undefined && (
          <div className="flex items-center justify-center gap-2">
            <span 
              className={`
                px-3 py-1 rounded-full text-sm font-bold
                ${hasBlackjack ? 'bg-yellow-500 text-black' : ''}
                ${isBusted ? 'bg-red-500 text-white' : ''}
                ${!hasBlackjack && !isBusted ? 'bg-primary-600 text-white' : ''}
              `}
            >
              {hasBlackjack ? 'BLACKJACK!' : `Value: ${handValue}`}
            </span>
            
            {/* Status indicators */}
            {isBusted && (
              <span className="text-red-400 text-sm font-medium">BUST!</span>
            )}
          </div>
        )}
      </div>

      {/* Cards Display */}
      <div className="flex items-center justify-center gap-2 flex-wrap min-h-[100px]">
        {cards.length === 0 ? (
          <div className="text-gray-400 text-sm italic">No cards dealt</div>
        ) : (
          cards.map((card, index) => {
            const shouldHideCard = isDealer && hideFirstCard && index === 0;
            
            return (
              <div
                key={`${card.rank}-${card.suit}-${index}`}
                className={`
                  transform transition-all duration-500 ease-out
                  ${index > 0 ? `animate-[slideIn_0.5s_ease-out_${index * 0.2}s_both]` : ''}
                `}
                style={{
                  zIndex: cards.length - index,
                  marginLeft: index > 0 ? '-10px' : '0'
                }}
              >
                <Card 
                  card={card} 
                  size="small"
                  showBack={shouldHideCard}
                  className="drop-shadow-md"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Card Count */}
      {cards.length > 0 && (
        <div className="mt-2 text-xs text-gray-300">
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Hand;