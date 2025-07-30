import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/test-utils';
import ErrorBoundary from '../ErrorBoundary';

// Mock console.error to prevent noise in tests
const originalConsoleError = console.error;

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Mock console.error to prevent test output noise
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  // Component that throws an error for testing
  const ThrowError: React.FC<{ shouldThrow: boolean; message?: string }> = ({ 
    shouldThrow, 
    message = 'Test error' 
  }) => {
    if (shouldThrow) {
      throw new Error(message);
    }
    return <div>No error</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Component crashed" />
      </ErrorBoundary>
    );

    // Should display error message
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Component crashed')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render custom fallback UI when provided', () => {
    const customFallback = <div>Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} message="Callback test error" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
    
    const [error] = onError.mock.calls[0];
    expect(error.message).toBe('Callback test error');
  });

  it('should log errors to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Console log test" />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should recover from error when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error state
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content again
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show technical details in development mode', () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', {
      writable: true,
      value: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show details toggle
    expect(screen.getByText('Show technical details')).toBeInTheDocument();

    // Restore original environment
    Object.defineProperty(import.meta.env, 'DEV', {
      value: originalEnv,
    });
  });

  it('should hide technical details in production mode', () => {
    // Mock production environment
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', {
      writable: true,
      value: false,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not show details toggle in production
    expect(screen.queryByText('Show technical details')).not.toBeInTheDocument();

    // Restore original environment
    Object.defineProperty(import.meta.env, 'DEV', {
      value: originalEnv,
    });
  });

  it('should have proper styling and layout', () => {
    render(
      <ErrorBoundary data-testid="error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for gradient background and centering
    const container = screen.getByRole('alert').closest('.min-h-screen');
    expect(container).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-primary-50',
      'to-primary-100',
      'flex',
      'items-center',
      'justify-center',
      'p-4'
    );

    // Check for error message styling
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass('shadow-lg');
  });

  it('should handle null or undefined errors gracefully', () => {
    // Create a component that throws null (edge case)
    const ThrowNullError: React.FC = () => {
      throw null;
    };

    render(
      <ErrorBoundary>
        <ThrowNullError />
      </ErrorBoundary>
    );

    // Should still show error UI with fallback message
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should maintain error state until explicitly reset', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Re-render with different props but same error boundary
    rerender(
      <ErrorBoundary>
        <div>New content</div>
      </ErrorBoundary>
    );

    // Should still show error until reset
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('New content')).not.toBeInTheDocument();
  });

  it('should handle errors in different child components', () => {
    const Component1 = () => <div>Component 1</div>;
    const Component2 = () => { throw new Error('Component 2 error'); };

    render(
      <ErrorBoundary>
        <Component1 />
        <Component2 />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Component 2 error')).toBeInTheDocument();
    expect(screen.queryByText('Component 1')).not.toBeInTheDocument();
  });

  it('should handle async errors that become sync', () => {
    // This tests the boundary's ability to catch errors that surface during render
    const AsyncErrorComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Async component error');
      }
      return <div>Async component loaded</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <AsyncErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Async component loaded')).toBeInTheDocument();

    // Trigger error on rerender
    rerender(
      <ErrorBoundary>
        <AsyncErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Async component error')).toBeInTheDocument();
  });

  describe('error boundary isolation', () => {
    it('should not catch errors from event handlers', () => {
      const ErrorButton: React.FC = () => {
        const handleClick = () => {
          throw new Error('Event handler error');
        };

        return <button onClick={handleClick}>Throw Error</button>;
      };

      render(
        <ErrorBoundary>
          <ErrorButton />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Event handler errors should not be caught by error boundary
      expect(() => {
        fireEvent.click(button);
      }).toThrow('Event handler error');

      // Error boundary should not activate
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should only catch errors in its subtree', () => {
      const SafeComponent = () => <div>Safe component</div>;
      
      render(
        <div>
          <ErrorBoundary>
            <SafeComponent />
          </ErrorBoundary>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} message="Isolated error" />
          </ErrorBoundary>
        </div>
      );

      // First boundary should show safe content
      expect(screen.getByText('Safe component')).toBeInTheDocument();
      
      // Second boundary should show error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Isolated error')).toBeInTheDocument();
    });
  });
});