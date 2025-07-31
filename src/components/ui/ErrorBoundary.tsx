import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { handleErrorBoundaryError, logger } from '../../services/monitoring';
import { sanitizeXSS } from '../../utils/validation';
import { isProduction } from '../../config/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  sanitizedMessage: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: null,
      sanitizedMessage: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Sanitize error message to prevent XSS
    const sanitizedMessage = isProduction 
      ? 'An unexpected error occurred. Please try again.' 
      : sanitizeXSS(error.message || 'Unknown error');
    
    return { 
      hasError: true, 
      error,
      errorId,
      sanitizedMessage
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    // Enhanced error logging with security context
    logger.error('React Error Boundary caught error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Report to monitoring service with sanitized data
    handleErrorBoundaryError(error, errorInfo);
    
    // Check for potential security-related errors
    this.analyzeSecurityImplications(error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private analyzeSecurityImplications(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    // Check for potential security-related error patterns
    const securityPatterns = [
      /script/i,
      /eval/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
      /innerHTML/i,
      /dangerouslySetInnerHTML/i
    ];
    
    const errorString = `${error.message} ${error.stack || ''} ${errorInfo.componentStack}`;
    const potentialSecurityIssue = securityPatterns.some(pattern => pattern.test(errorString));
    
    if (potentialSecurityIssue) {
      logger.warn('Potential security-related error detected', {
        errorId,
        errorType: error.name,
        message: 'Error contains security-sensitive patterns',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRetry = () => {
    logger.info('Error boundary retry attempted', {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorId: null,
      sanitizedMessage: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Create sanitized error for display
      new Error(this.state.sanitizedMessage || 'An unexpected error occurred');
      
      return (
        <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {this.state.sanitizedMessage}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-gray-400 mb-4">
                    Error ID: {this.state.errorId}
                  </p>
                )}
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;