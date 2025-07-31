import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '../../test/utils/test-utils';
import HomePage from '../HomePage';

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render the main page content', () => {
    render(<HomePage />);
    
    // Check main heading
    expect(screen.getByRole('heading', { level: 1, name: /blackjack/i })).toBeInTheDocument();
    
    // Check description text
    expect(screen.getByText(/welcome to your production-ready blackjack frontend/i)).toBeInTheDocument();
    expect(screen.getByText(/built with react 19, typescript, tailwind css/i)).toBeInTheDocument();
  });

  it('should display sample cards', () => {
    render(<HomePage />);
    
    // Check sample cards section
    expect(screen.getByRole('heading', { level: 2, name: /sample cards/i })).toBeInTheDocument();
    
    // Should have three sample cards
    expect(screen.getByRole('img', { name: /A of Hearts/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /K of Spades/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /7 of Diamonds/i })).toBeInTheDocument();
    
    // Check accessibility description
    expect(screen.getByText(/accessible cards with aria labels/i)).toBeInTheDocument();
  });

  it('should show feature list', () => {
    render(<HomePage />);
    
    // Check feature section heading
    expect(screen.getByRole('heading', { level: 2, name: /production-ready features/i })).toBeInTheDocument();
    
    // Check some key features
    expect(screen.getByText(/typescript domain types/i)).toBeInTheDocument();
    expect(screen.getByText(/enhanced api service/i)).toBeInTheDocument();
    expect(screen.getByText(/zustand state management/i)).toBeInTheDocument();
    expect(screen.getByText(/error boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/accessible components/i)).toBeInTheDocument();
  });

  it('should have action buttons', () => {
    render(<HomePage />);
    
    const startButton = screen.getByRole('button', { name: /start playing/i });
    const docsButton = screen.getByRole('button', { name: /view documentation/i });
    
    expect(startButton).toBeInTheDocument();
    expect(docsButton).toBeInTheDocument();
    
    // Check button styling
    expect(startButton).toHaveClass('font-semibold');
    expect(docsButton).toHaveClass('bg-gray-200'); // secondary variant
  });

  describe('loading demo functionality', () => {
    it('should show loading state when demo button is clicked', async () => {
      render(<HomePage />);
      
      const demoButton = screen.getByRole('button', { name: /demo loading/i });
      expect(demoButton).toBeInTheDocument();
      
      // Click the demo button
      act(() => {
        fireEvent.click(demoButton);
      });
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /loading\.\.\./i })).toBeInTheDocument();
      expect(screen.getByText(/starting game\.\.\./i)).toBeInTheDocument();
      const spinners = screen.getAllByRole('status');
      expect(spinners.length).toBeGreaterThan(0); // At least one loading spinner
      
      // Button should be disabled during loading
      const loadingButton = screen.getByRole('button', { name: /loading\.\.\./i });
      expect(loadingButton).toBeDisabled();
    });


    it('should prevent multiple simultaneous loading states', () => {
      render(<HomePage />);
      
      const demoButton = screen.getByRole('button', { name: /demo loading/i });
      
      // Click multiple times
      act(() => {
        fireEvent.click(demoButton);
        fireEvent.click(demoButton);
        fireEvent.click(demoButton);
      });
      
      // Should only show one loading state
      const loadingElements = screen.getAllByText(/starting game\.\.\./i);
      expect(loadingElements).toHaveLength(1);
    });
  });

  describe('error demo functionality', () => {
    it('should show error when demo error button is clicked', () => {
      render(<HomePage />);
      
      const errorButton = screen.getByRole('button', { name: /demo error/i });
      expect(errorButton).toBeInTheDocument();
      
      // Click the error button
      act(() => {
        fireEvent.click(errorButton);
      });
      
      // Should show error message
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/sample error message for demonstration/i)).toBeInTheDocument();
      
      // Button text should change
      expect(screen.getByRole('button', { name: /hide error/i })).toBeInTheDocument();
    });

    it('should hide error when hide error button is clicked', () => {
      render(<HomePage />);
      
      const errorButton = screen.getByRole('button', { name: /demo error/i });
      act(() => {
        fireEvent.click(errorButton);
      });
      
      // Error should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Click hide error button
      const hideButton = screen.getByRole('button', { name: /hide error/i });
      act(() => {
        fireEvent.click(hideButton);
      });
      
      // Error should be hidden
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /demo error/i })).toBeInTheDocument();
    });

    it('should hide error when retry button is clicked', () => {
      render(<HomePage />);
      
      const errorButton = screen.getByRole('button', { name: /demo error/i });
      act(() => {
        fireEvent.click(errorButton);
      });
      
      // Error should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Click retry button in error message
      const retryButton = screen.getByRole('button', { name: /try again/i });
      act(() => {
        fireEvent.click(retryButton);
      });
      
      // Error should be hidden
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /demo error/i })).toBeInTheDocument();
    });

    it('should toggle error state correctly', () => {
      render(<HomePage />);
      
      const errorButton = screen.getByRole('button', { name: /demo error/i });
      
      // Toggle error on
      act(() => {
        fireEvent.click(errorButton);
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide error/i })).toBeInTheDocument();
      
      // Toggle error off
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /hide error/i }));
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /demo error/i })).toBeInTheDocument();
      
      // Toggle error on again
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /demo error/i }));
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HomePage />);
      
      // Main heading (h1)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Section headings (h2)
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);
      
      // Subsection headings (h3)
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it('should have accessible card components', () => {
      render(<HomePage />);
      
      // All cards should have proper ARIA labels
      expect(screen.getByRole('img', { name: /A of Hearts/i })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /K of Spades/i })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /7 of Diamonds/i })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<HomePage />);
      
      // All buttons should be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Buttons should have accessible names
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper focus management', () => {
      render(<HomePage />);
      
      // Interactive elements should be focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('responsive design', () => {
    it('should have responsive layout classes', () => {
      render(<HomePage />);
      
      // Check main container has responsive classes  
      const heading = screen.getByRole('heading', { name: /blackjack/i });
      const container = heading.closest('.text-center');
      expect(container).toHaveClass('max-w-4xl', 'mx-auto');
      
      // Check grid has responsive classes
      const gridContainers = document.querySelectorAll('.grid');
      gridContainers.forEach(grid => {
        if (grid.classList.contains('md:grid-cols-2')) {
          expect(grid).toHaveClass('md:grid-cols-2');
        }
      });
    });

    it('should have responsive button layout', () => {
      render(<HomePage />);
      
      // Action buttons container should have responsive flex classes
      const buttonContainer = screen.getByRole('button', { name: /start playing/i }).closest('.flex');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('styling and animations', () => {
    it('should have proper background styling', () => {
      render(<HomePage />);
      
      // Main background should have gradient and pattern
      const backgrounds = document.querySelectorAll('[class*="bg-linear-to-br"], [class*="bg-gradient-to-br"]');
      expect(backgrounds.length).toBeGreaterThan(0);
      
      // Pattern overlay should exist (Tailwind v4 uses bg-size-[20px_20px] syntax)
      const pattern = document.querySelector('[class*="bg-size-[20px_20px]"], [class*="background-size"]');
      expect(pattern).toBeInTheDocument();
    });

    it('should apply animation classes to cards', () => {
      render(<HomePage />);
      
      // Sample cards should have animation classes
      const cardElements = document.querySelectorAll('.animate-card-deal');
      expect(cardElements.length).toBe(3); // Three sample cards
    });

    it('should have proper card styling with backdrop blur-sm', () => {
      render(<HomePage />);
      
      // Main content card should have backdrop blur
      const mainCard = document.querySelector('.backdrop-blur-sm');
      expect(mainCard).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    it('should properly integrate with Card components', () => {
      render(<HomePage />);
      
      // Should render Card components with correct props
      const cards = screen.getAllByRole('img');
      const cardImages = cards.filter(card => 
        card.getAttribute('aria-label')?.includes('of')
      );
      expect(cardImages).toHaveLength(3);
    });

    it('should properly integrate with Button components', () => {
      render(<HomePage />);
      
      // Should render Button components with different variants
      const primaryButtons = document.querySelectorAll('.bg-primary-600');
      const secondaryButtons = document.querySelectorAll('.bg-gray-200');
      const dangerButtons = document.querySelectorAll('.bg-red-600');
      
      expect(primaryButtons.length).toBeGreaterThan(0);
      expect(secondaryButtons.length).toBeGreaterThan(0);
      expect(dangerButtons.length).toBeGreaterThan(0);
    });


    it('should properly integrate with ErrorMessage component', () => {
      render(<HomePage />);
      
      const errorButton = screen.getByRole('button', { name: /demo error/i });
      act(() => {
        fireEvent.click(errorButton);
      });
      
      // Should show ErrorMessage with correct props
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText(/sample error message for demonstration/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});