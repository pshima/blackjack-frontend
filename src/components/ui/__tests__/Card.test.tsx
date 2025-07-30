import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/test-utils';
import Card from '../Card';
import { createMockCard } from '../../../test/utils/test-utils';

describe('Card Component', () => {
  const mockCard = createMockCard({
    suit: 'hearts',
    rank: 'A',
    value: 11
  });

  it('should render a visible card with correct content', () => {
    render(<Card card={mockCard} />);
    
    const card = screen.getByRole('img', { name: /ace of hearts/i });
    expect(card).toBeInTheDocument();
    
    // Should show rank and suit symbols
    expect(screen.getAllByText('A')).toHaveLength(2); // Top-left and bottom-right
    expect(screen.getAllByText('♥')).toHaveLength(3); // Top-left, center, and bottom-right
    
    // Should have screen reader text for card value
    expect(screen.getByText('Card value: 11 points')).toBeInTheDocument();
  });

  it('should render a hidden card', () => {
    render(<Card card={mockCard} isHidden />);
    
    const card = screen.getByRole('img', { name: /hidden card/i });
    expect(card).toBeInTheDocument();
    
    // Should not show rank or suit for hidden card
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('♥')).not.toBeInTheDocument();
    
    // Should have hidden card styling
    expect(card).toHaveClass('bg-card-back', 'border-card-back');
    
    // Should have screen reader text for hidden card
    expect(screen.getByText('Card is face down')).toBeInTheDocument();
  });

  describe('card suits and colors', () => {
    it('should render red suits correctly', () => {
      const heartsCard = createMockCard({ suit: 'hearts', rank: 'K' });
      const diamondsCard = createMockCard({ suit: 'diamonds', rank: 'Q' });
      
      const { rerender } = render(<Card card={heartsCard} />);
      
      // Hearts should be red
      let rankElements = screen.getAllByText('K');
      let suitElements = screen.getAllByText('♥');
      rankElements.concat(suitElements).forEach(element => {
        expect(element).toHaveClass('text-card-red');
      });
      
      rerender(<Card card={diamondsCard} />);
      
      // Diamonds should be red
      rankElements = screen.getAllByText('Q');
      suitElements = screen.getAllByText('♦');
      rankElements.concat(suitElements).forEach(element => {
        expect(element).toHaveClass('text-card-red');
      });
    });

    it('should render black suits correctly', () => {
      const clubsCard = createMockCard({ suit: 'clubs', rank: 'J' });
      const spadesCard = createMockCard({ suit: 'spades', rank: '10' });
      
      const { rerender } = render(<Card card={clubsCard} />);
      
      // Clubs should be black
      let rankElements = screen.getAllByText('J');
      let suitElements = screen.getAllByText('♣');
      rankElements.concat(suitElements).forEach(element => {
        expect(element).toHaveClass('text-card-black');
      });
      
      rerender(<Card card={spadesCard} />);
      
      // Spades should be black
      rankElements = screen.getAllByText('10');
      suitElements = screen.getAllByText('♠');
      rankElements.concat(suitElements).forEach(element => {
        expect(element).toHaveClass('text-card-black');
      });
    });
  });

  describe('suit symbols', () => {
    it('should display correct suit symbols', () => {
      const suits = [
        { suit: 'hearts', symbol: '♥' },
        { suit: 'diamonds', symbol: '♦' },
        { suit: 'clubs', symbol: '♣' },
        { suit: 'spades', symbol: '♠' },
      ] as const;

      suits.forEach(({ suit, symbol }) => {
        const card = createMockCard({ suit, rank: 'A' });
        const { unmount } = render(<Card card={card} />);
        
        // Should have 3 instances: top-left, center, bottom-right
        expect(screen.getAllByText(symbol)).toHaveLength(3);
        
        unmount();
      });
    });
  });

  describe('sizes', () => {
    it('should apply small size classes', () => {
      render(<Card card={mockCard} size="sm" testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-card-sm', 'h-16', 'p-1', 'text-xs');
    });

    it('should apply medium size classes by default', () => {
      render(<Card card={mockCard} testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-card', 'h-24', 'p-2', 'text-sm');
    });

    it('should apply large size classes', () => {
      render(<Card card={mockCard} size="lg" testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-card-lg', 'h-32', 'p-3', 'text-base');
    });
  });

  describe('variants', () => {
    it('should apply default variant styles', () => {
      render(<Card card={mockCard} testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-casino-cream', 'border-card-border');
    });

    it('should apply highlighted variant when isHighlighted is true', () => {
      render(<Card card={mockCard} isHighlighted testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-casino-cream', 'border-primary-400', 'ring-2', 'ring-primary-400');
    });

    it('should apply hidden variant when isHidden is true', () => {
      render(<Card card={mockCard} isHidden testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-card-back', 'border-card-back');
    });
  });

  describe('interactivity', () => {
    it('should be interactive when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card card={mockCard} onClick={handleClick} testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-102', 'hover:shadow-card-hover');
      expect(card).toHaveAttribute('tabIndex', '0');
      
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be interactive when interactive prop is true', () => {
      render(<Card card={mockCard} interactive testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-102', 'hover:shadow-card-hover');
    });

    it('should not be interactive by default', () => {
      render(<Card card={mockCard} testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('should handle keyboard events when interactive', () => {
      const handleClick = vi.fn();
      render(<Card card={mockCard} onClick={handleClick} testId="card" />);
      
      const card = screen.getByTestId('card');
      
      // Test Enter key
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
      
      // Test other keys (should not trigger)
      fireEvent.keyDown(card, { key: 'Tab' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA role and label', () => {
      render(<Card card={mockCard} />);
      
      const card = screen.getByRole('img', { name: /ace of hearts/i });
      expect(card).toHaveAttribute('aria-label', 'Ace of Hearts');
    });

    it('should have proper ARIA label for hidden cards', () => {
      render(<Card card={mockCard} isHidden />);
      
      const card = screen.getByRole('img', { name: /hidden card/i });
      expect(card).toHaveAttribute('aria-label', 'Hidden card');
    });

    it('should be focusable when interactive', () => {
      const handleClick = vi.fn();
      render(<Card card={mockCard} onClick={handleClick} />);
      
      const card = screen.getByRole('img');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should not be focusable when not interactive', () => {
      render(<Card card={mockCard} />);
      
      const card = screen.getByRole('img');
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('should have screen reader content for card value', () => {
      render(<Card card={mockCard} />);
      
      expect(screen.getByText('Card value: 11 points')).toHaveClass('sr-only');
    });

    it('should have screen reader content for single point cards', () => {
      const aceCard = createMockCard({ rank: 'A', value: 1 });
      render(<Card card={aceCard} />);
      
      expect(screen.getByText('Card value: 1 point')).toHaveClass('sr-only');
    });

    it('should hide decorative elements from screen readers', () => {
      render(<Card card={mockCard} testId="card" />);
      
      const card = screen.getByTestId('card');
      const centerSymbol = card.querySelector('[aria-hidden="true"]');
      expect(centerSymbol).toBeInTheDocument();
      expect(centerSymbol).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('card layout', () => {
    it('should have proper layout structure for visible cards', () => {
      render(<Card card={mockCard} testId="card" />);
      
      const card = screen.getByTestId('card');
      
      // Should have top-left corner
      const topLeft = card.querySelector('.flex.flex-col.items-center.font-bold.font-card:not(.rotate-180)');
      expect(topLeft).toBeInTheDocument();
      
      // Should have center symbol
      const center = card.querySelector('.absolute.inset-0.flex.items-center.justify-center');
      expect(center).toBeInTheDocument();
      
      // Should have bottom-right corner (rotated)
      const bottomRight = card.querySelector('.flex.flex-col.items-center.font-bold.font-card.rotate-180');
      expect(bottomRight).toBeInTheDocument();
    });

    it('should have simple layout for hidden cards', () => {
      render(<Card card={mockCard} isHidden testId="card" />);
      
      const card = screen.getByTestId('card');
      
      // Should have center placeholder for hidden cards
      const centerPlaceholder = card.querySelector('.flex.items-center.justify-center.h-full');
      expect(centerPlaceholder).toBeInTheDocument();
      
      // Should not have rank/suit displays
      expect(card.querySelector('.font-card')).not.toBeInTheDocument();
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      render(<Card card={mockCard} className="custom-class" testId="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('should apply testId', () => {
      render(<Card card={mockCard} testId="custom-card" />);
      
      const card = screen.getByTestId('custom-card');
      expect(card).toBeInTheDocument();
    });

    it('should combine custom className with variant classes', () => {
      render(
        <Card 
          card={mockCard} 
          className="custom-class" 
          isHighlighted 
          testId="card" 
        />
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('border-primary-400', 'ring-2', 'ring-primary-400'); // highlighted variant
    });
  });

  describe('edge cases', () => {
    it('should handle cards with different ranks', () => {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
      
      ranks.forEach(rank => {
        const card = createMockCard({ rank, suit: 'hearts' });
        const { unmount } = render(<Card card={card} />);
        
        expect(screen.getAllByText(rank)).toHaveLength(2); // Top-left and bottom-right
        
        unmount();
      });
    });

    it('should handle card prop changes', () => {
      const initialCard = createMockCard({ suit: 'hearts', rank: 'A' });
      const newCard = createMockCard({ suit: 'spades', rank: 'K' });
      
      const { rerender } = render(<Card card={initialCard} />);
      
      expect(screen.getByRole('img', { name: /ace of hearts/i })).toBeInTheDocument();
      
      rerender(<Card card={newCard} />);
      
      expect(screen.getByRole('img', { name: /king of spades/i })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /ace of hearts/i })).not.toBeInTheDocument();
    });

    it('should handle isHidden prop changes', () => {
      const { rerender } = render(<Card card={mockCard} isHidden />);
      
      expect(screen.getByRole('img', { name: /hidden card/i })).toBeInTheDocument();
      
      rerender(<Card card={mockCard} isHidden={false} />);
      
      expect(screen.getByRole('img', { name: /ace of hearts/i })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /hidden card/i })).not.toBeInTheDocument();
    });
  });
});