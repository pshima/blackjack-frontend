import React from 'react';
import type { LoadingProps } from '../types';

// Animated loading spinner component with optional text and fullscreen overlay
const LoadingSpinner: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text,
  fullScreen = false,
  className = '',
  testId 
}) => {
  // Different spinner sizes for various use cases
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Container styling - fullscreen overlay or inline display
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  return (
    <div 
      className={`${containerClasses} ${className}`}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center space-y-2">
        {/* Spinning circle with colored border for visual loading indication */}
        <div 
          className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
          aria-hidden="true"
        />
        {/* Optional loading text below spinner */}
        {text && (
          <p className="text-primary-600 text-sm font-medium" aria-live="polite">
            {text}
          </p>
        )}
        {/* Screen reader accessibility text */}
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;