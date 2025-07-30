import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type { Card as CardType } from '../../types/blackjack';

const cardVariants = cva(
  'relative flex flex-col justify-between border-2 rounded-card shadow-card transition-all duration-200 select-none',
  {
    variants: {
      size: {
        sm: 'w-card-sm h-16 p-1 text-xs',
        md: 'w-card h-24 p-2 text-sm',
        lg: 'w-card-lg h-32 p-3 text-base',
      },
      variant: {
        default: 'bg-casino-cream border-card-border',
        hidden: 'bg-card-back border-card-back',
        highlighted: 'bg-casino-cream border-primary-400 ring-2 ring-primary-400',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-102 hover:shadow-card-hover',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      interactive: false,
    },
  }
);

export interface CardProps extends VariantProps<typeof cardVariants> {
  card: CardType;
  isHidden?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  className?: string;
  testId?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
} as const;

const suitNames = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
} as const;

const Card: React.FC<CardProps> = ({
  card,
  isHidden = false,
  isHighlighted = false,
  onClick,
  size,
  interactive,
  className,
  testId,
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColor = isRed ? 'text-card-red' : 'text-card-black';
  
  const cardAnnouncement = isHidden 
    ? 'Hidden card' 
    : `${card.rank} of ${suitNames[card.suit]}`;

  const variant = isHidden ? 'hidden' : isHighlighted ? 'highlighted' : 'default';

  return (
    <div
      className={cn(
        cardVariants({ 
          size, 
          variant, 
          interactive: interactive || !!onClick 
        }),
        className
      )}
      role="img"
      aria-label={cardAnnouncement}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={testId}
    >
      {isHidden ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-8 bg-white/20 rounded-sm" />
        </div>
      ) : (
        <>
          {/* Top left corner */}
          <div className={cn('flex flex-col items-center font-bold font-card', suitColor)}>
            <span className="leading-none">{card.rank}</span>
            <span className="text-lg leading-none">{suitSymbols[card.suit]}</span>
          </div>
          
          {/* Center suit symbol */}
          <div className={cn('absolute inset-0 flex items-center justify-center text-4xl', suitColor)}>
            <span aria-hidden="true">{suitSymbols[card.suit]}</span>
          </div>
          
          {/* Bottom right corner (rotated) */}
          <div className={cn('flex flex-col items-center font-bold font-card rotate-180 self-end', suitColor)}>
            <span className="leading-none">{card.rank}</span>
            <span className="text-lg leading-none">{suitSymbols[card.suit]}</span>
          </div>
        </>
      )}
      
      {/* Screen reader additional context */}
      <span className="sr-only">
        {isHidden ? (
          'Card is face down'
        ) : (
          `Card value: ${card.value} point${card.value === 1 ? '' : 's'}`
        )}
      </span>
    </div>
  );
};

export default Card;