import React from 'react';
import type { ButtonProps } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';

// Reusable button component with multiple variants, sizes, and loading states
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  testId
}) => {
  // Base styling that applies to all button variants
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  // Color schemes for different button types
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:text-primary-300'
  };

  // Padding and font sizes for different button sizes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Button is disabled if explicitly disabled or currently loading
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      data-testid={testId}
      aria-disabled={isDisabled}
    >
      <span className="flex items-center justify-center">
        {/* Show loading spinner when button is in loading state */}
        {loading && (
          <LoadingSpinner 
            size="sm" 
            className="mr-2" 
          />
        )}
        {children}
      </span>
    </button>
  );
};

export default Button;