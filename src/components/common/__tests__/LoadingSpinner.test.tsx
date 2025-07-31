import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    
    // Should have screen reader text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    
    const textElement = screen.getByText('Please wait...');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveAttribute('aria-live', 'polite');
  });

  it('should not render text when not provided', () => {
    render(<LoadingSpinner />);
    
    // Should only have screen reader text, not visible text
    expect(screen.queryByText(/please wait/i)).not.toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  describe('sizes', () => {
    it('should apply small size classes', () => {
      render(<LoadingSpinner size="sm" testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const spinnerElement = container.querySelector('[aria-hidden="true"]');
      expect(spinnerElement).toHaveClass('w-4', 'h-4');
    });

    it('should apply medium size classes by default', () => {
      render(<LoadingSpinner testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const spinnerElement = container.querySelector('[aria-hidden="true"]');
      expect(spinnerElement).toHaveClass('w-8', 'h-8');
    });

    it('should apply large size classes', () => {
      render(<LoadingSpinner size="lg" testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const spinnerElement = container.querySelector('[aria-hidden="true"]');
      expect(spinnerElement).toHaveClass('w-12', 'h-12');
    });
  });

  describe('fullScreen mode', () => {
    it('should render in fullscreen mode', () => {
      render(<LoadingSpinner fullScreen testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      expect(container).toHaveClass(
        'fixed',
        'inset-0',
        'bg-black',
        'bg-opacity-50',
        'flex',
        'items-center',
        'justify-center',
        'z-50'
      );
    });

    it('should render in inline mode by default', () => {
      render(<LoadingSpinner testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
      expect(container).not.toHaveClass('fixed', 'inset-0');
    });
  });

  describe('styling and animation', () => {
    it('should have proper spinner styling', () => {
      render(<LoadingSpinner testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const spinnerElement = container.querySelector('[aria-hidden="true"]');
      
      expect(spinnerElement).toHaveClass(
        'border-4',
        'border-primary-200',
        'border-t-primary-600',
        'rounded-full',
        'animate-spin'
      );
    });

    it('should have proper text styling when text is provided', () => {
      render(<LoadingSpinner text="Loading data..." />);
      
      const textElement = screen.getByText('Loading data...');
      expect(textElement).toHaveClass(
        'text-primary-600',
        'text-sm',
        'font-medium'
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper ARIA attributes with text', () => {
      render(<LoadingSpinner text="Processing..." />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      
      const textElement = screen.getByText('Processing...');
      expect(textElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide decorative spinner from screen readers', () => {
      render(<LoadingSpinner testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const spinnerElement = container.querySelector('[aria-hidden="true"]');
      expect(spinnerElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide screen reader text', () => {
      render(<LoadingSpinner />);
      
      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      expect(container).toHaveClass('custom-class');
    });

    it('should apply testId', () => {
      render(<LoadingSpinner testId="custom-spinner" />);
      
      const spinner = screen.getByTestId('custom-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should combine custom className with default classes', () => {
      render(
        <LoadingSpinner 
          className="custom-class" 
          fullScreen 
          testId="spinner" 
        />
      );
      
      const container = screen.getByTestId('spinner');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('fixed', 'inset-0'); // fullscreen classes
    });
  });

  describe('layout and structure', () => {
    it('should have proper container structure', () => {
      render(<LoadingSpinner testId="spinner" />);
      
      const container = screen.getByTestId('spinner');
      const innerContainer = container.querySelector('.flex.flex-col.items-center.space-y-2');
      expect(innerContainer).toBeInTheDocument();
    });

  });

  describe('edge cases', () => {
    it('should handle empty text prop', () => {
      render(<LoadingSpinner text="" />);
      
      // Should not render empty text element
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });


    it('should work with all size and fullScreen combinations', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <LoadingSpinner size={size} fullScreen testId={`spinner-${size}`} />
        );
        
        const container = screen.getByTestId(`spinner-${size}`);
        expect(container).toHaveClass('fixed', 'inset-0'); // fullScreen
        
        const spinnerElement = container.querySelector('[aria-hidden="true"]');
        const expectedClasses = {
          sm: ['w-4', 'h-4'],
          md: ['w-8', 'h-8'],
          lg: ['w-12', 'h-12'],
        };
        
        expectedClasses[size].forEach(className => {
          expect(spinnerElement).toHaveClass(className);
        });
        
        unmount();
      });
    });
  });
});