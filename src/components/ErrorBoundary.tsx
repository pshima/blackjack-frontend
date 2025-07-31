import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

// React error boundary component that catches JavaScript errors in child components and displays fallback UI
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Static method called when an error is thrown, updates state to trigger error UI
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  // Lifecycle method called after an error is caught, logs error details for debugging
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName || 'Component'}:`, error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      errorInfo: errorInfo.componentStack,
    });
  }

  // Renders either the error UI when there's an error, or the normal children components
  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with error details and retry button
      return (
        <div className="error-boundary bg-red-50 border border-red-200 p-6 m-4 border-2 border-red-400">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Error in {this.props.componentName || 'Component'}
          </h2>
          <details className="text-sm">
            <summary className="cursor-pointer text-red-700 font-medium mb-2">
              {this.state.error?.message || 'Unknown error occurred'}
            </summary>
            <div className="bg-red-100 p-3 mt-2 overflow-auto border border-red-300">
              <p className="font-mono text-xs text-red-800 mb-2">
                <strong>Error:</strong> {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <p className="font-mono text-xs text-red-700">
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{this.state.errorInfo}</pre>
                </p>
              )}
            </div>
          </details>
          {/* Reset error state and attempt to re-render the component tree */}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            className="mt-3 bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 border-2 border-black"
          >
            Try Again
          </button>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}