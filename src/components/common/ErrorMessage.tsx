import React from 'react';
import type { ErrorProps } from '../types';

// Error display component with multiple styling variants and optional retry functionality
const ErrorMessage: React.FC<ErrorProps> = ({
  error,
  retry,
  showDetails = false,
  variant = 'card',
  className = '',
  testId
}) => {
  // Extract message and stack trace from Error objects or use string directly
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails = error instanceof Error ? error.stack : undefined;

  // Different visual styles for different contexts (inline text, card layout, alert banner)
  const variantClasses = {
    inline: 'text-red-600 text-sm p-2',
    card: 'bg-red-50 border border-red-200 p-4 border-2 border-red-400',
    alert: 'bg-red-100 border-l-4 border-red-500 p-4'
  };

  return (
    <div 
      className={`${variantClasses[variant]} ${className}`}
      data-testid={testId}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        {/* Error icon to visually indicate something went wrong */}
        <div className="shrink-0">
          <svg 
            className="w-5 h-5 text-red-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {errorMessage}
          </p>
          {/* Collapsible technical error details for debugging */}
          {showDetails && errorDetails && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Show technical details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 overflow-x-auto border border-red-300">
                {errorDetails}
              </pre>
            </details>
          )}
          {/* Optional retry button to attempt the failed operation again */}
          {retry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={retry}
                className="bg-red-600 text-white px-3 py-1 text-sm hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border-2 border-black"
                aria-label="Try again"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;