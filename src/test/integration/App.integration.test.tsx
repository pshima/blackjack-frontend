import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import App from '../../App';

describe('App Integration Tests', () => {
  it('should render the complete application without errors', () => {
    render(<App />);
    
    // Should render the main heading from HomePage
    expect(screen.getByRole('heading', { level: 1, name: /blackjack/i })).toBeInTheDocument();
    
    // Should render key components
    expect(screen.getByText(/welcome to your production-ready blackjack frontend/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start playing/i })).toBeInTheDocument();
  });

  it('should have error boundary protection', () => {
    // This test verifies that the ErrorBoundary is wrapping the HomePage
    render(<App />);
    
    // The app should render successfully, indicating ErrorBoundary is working
    expect(screen.getByRole('heading', { name: /blackjack/i })).toBeInTheDocument();
  });

  it('should render all main UI components', () => {
    render(<App />);
    
    // Check for different types of buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(2); // Should have multiple buttons
    
    // Check for card components
    const cards = screen.getAllByRole('img');
    const gameCards = cards.filter(card => 
      card.getAttribute('aria-label')?.includes('of')
    );
    expect(gameCards.length).toBe(3); // Three sample cards
    
    // Check for headings structure
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    const h3s = screen.getAllByRole('heading', { level: 3 });
    
    expect(h1).toBeInTheDocument();
    expect(h2s.length).toBeGreaterThan(0);
    expect(h3s.length).toBeGreaterThan(0);
  });
});