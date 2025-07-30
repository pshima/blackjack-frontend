import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/test-utils';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  it('should render with string error', () => {
    render(<ErrorMessage error="Something went wrong" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render with Error object', () => {
    const error = new Error('Network failed');
    render(<ErrorMessage error={error} />);
    
    expect(screen.getByText('Network failed')).toBeInTheDocument();
  });

  it('should show error icon', () => {
    render(<ErrorMessage error="Test error" />);
    
    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  describe('variants', () => {
    it('should apply card variant styles by default', () => {
      render(<ErrorMessage error="Test error" testId="error-message" />);
      
      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'p-4');
    });

    it('should apply inline variant styles', () => {
      render(<ErrorMessage error="Test error" variant="inline" testId="error-message" />);
      
      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('text-red-600', 'text-sm', 'p-2');
    });

    it('should apply alert variant styles', () => {
      render(<ErrorMessage error="Test error" variant="alert" testId="error-message" />);
      
      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('bg-red-100', 'border-l-4', 'border-red-500', 'p-4');
    });
  });

  describe('retry functionality', () => {
    it('should show retry button when retry prop is provided', () => {
      const handleRetry = vi.fn();
      render(<ErrorMessage error="Test error" retry={handleRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call retry function when button is clicked', () => {
      const handleRetry = vi.fn();
      render(<ErrorMessage error="Test error" retry={handleRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when retry prop is not provided', () => {
      render(<ErrorMessage error="Test error" />);
      
      const retryButton = screen.queryByRole('button', { name: /try again/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it('should have proper retry button styling', () => {
      const handleRetry = vi.fn();
      render(<ErrorMessage error="Test error" retry={handleRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toHaveClass(
        'bg-red-600',
        'text-white',
        'px-3',
        'py-1',
        'text-sm',
        'rounded',
        'hover:bg-red-700',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-red-500',
        'focus:ring-offset-2'
      );
    });
  });

  describe('details functionality', () => {
    it('should show details when showDetails is true and error has stack', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at TestFile.js:1:1';
      
      render(<ErrorMessage error={error} showDetails />);
      
      const detailsElement = screen.getByText('Show technical details');
      expect(detailsElement).toBeInTheDocument();
    });

    it('should not show details when showDetails is false', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at TestFile.js:1:1';
      
      render(<ErrorMessage error={error} showDetails={false} />);
      
      const detailsElement = screen.queryByText('Show technical details');
      expect(detailsElement).not.toBeInTheDocument();
    });

    it('should not show details when error has no stack', () => {
      const error = new Error('Test error');
      delete error.stack;
      
      render(<ErrorMessage error={error} showDetails />);
      
      const detailsElement = screen.queryByText('Show technical details');
      expect(detailsElement).not.toBeInTheDocument();
    });

    it('should not show details for string errors', () => {
      render(<ErrorMessage error="String error" showDetails />);
      
      const detailsElement = screen.queryByText('Show technical details');
      expect(detailsElement).not.toBeInTheDocument();
    });

    it('should expand details when clicked', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at TestFile.js:1:1';
      
      render(<ErrorMessage error={error} showDetails />);
      
      const summary = screen.getByText('Show technical details');
      fireEvent.click(summary);
      
      // Details should be visible after clicking
      expect(screen.getByText(error.stack)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ErrorMessage error="Test error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper heading structure', () => {
      render(<ErrorMessage error="Test error" />);
      
      const heading = screen.getByText('Something went wrong');
      expect(heading.tagName).toBe('H3');
    });

    it('should have accessible retry button', () => {
      const handleRetry = vi.fn();
      render(<ErrorMessage error="Test error" retry={handleRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toHaveAttribute('aria-label', 'Try again');
    });

    it('should have accessible details toggle', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      render(<ErrorMessage error={error} showDetails />);
      
      const summary = screen.getByText('Show technical details');
      expect(summary).toHaveClass('cursor-pointer');
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      render(<ErrorMessage error="Test error" className="custom-class" testId="error-div" />);
      
      const container = screen.getByTestId('error-div');
      expect(container).toHaveClass('custom-class');
    });

    it('should apply testId', () => {
      render(<ErrorMessage error="Test error" testId="custom-error" />);
      
      const error = screen.getByTestId('custom-error');
      expect(error).toBeInTheDocument();
    });

    it('should combine custom className with variant classes', () => {
      render(
        <ErrorMessage 
          error="Test error" 
          className="custom-class" 
          variant="alert" 
          testId="error-div" 
        />
      );
      
      const container = screen.getByTestId('error-div');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('bg-red-100', 'border-l-4'); // alert variant classes
    });
  });

  describe('error type handling', () => {
    it('should handle Error objects with message', () => {
      const error = new Error('Custom error message');
      render(<ErrorMessage error={error} />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should handle Error objects without message', () => {
      const error = new Error();
      render(<ErrorMessage error={error} />);
      
      // Should still render the component, even with empty message
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle non-standard error objects', () => {
      const customError = {
        message: 'Custom error object',
        toString: () => 'Custom error object'
      };
      render(<ErrorMessage error={customError as any} />);
      
      expect(screen.getByText('Custom error object')).toBeInTheDocument();
    });
  });

  describe('layout and structure', () => {
    it('should have proper layout structure', () => {
      render(<ErrorMessage error="Test error" testId="error-div" />);
      
      const container = screen.getByTestId('error-div');
      const flexContainer = container.querySelector('.flex.items-start');
      expect(flexContainer).toBeInTheDocument();
      
      const iconContainer = flexContainer?.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
      
      const contentContainer = flexContainer?.querySelector('.ml-3.flex-1');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should have proper content hierarchy', () => {
      const handleRetry = vi.fn();
      const error = new Error('Test error');
      error.stack = 'Stack trace';
      
      render(
        <ErrorMessage 
          error={error} 
          retry={handleRetry} 
          showDetails 
          testId="error-div" 
        />
      );
      
      const container = screen.getByTestId('error-div');
      
      // Should have heading, message, details, and retry button in order
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByText('Show technical details')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});