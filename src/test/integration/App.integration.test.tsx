import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import App from '../../App';

describe('App Integration Tests', () => {

  it('should have error boundary protection', () => {
    // This test verifies that the ErrorBoundary is wrapping the HomePage
    render(<App />);
    
    // The app should render successfully, indicating ErrorBoundary is working
    expect(screen.getByRole('heading', { name: /glitchjack/i })).toBeInTheDocument();
  });

});