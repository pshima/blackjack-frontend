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

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName || 'Component'}:`, error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      errorInfo: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Error in {this.props.componentName || 'Component'}
          </h2>
          <details className="text-sm">
            <summary className="cursor-pointer text-red-700 font-medium mb-2">
              {this.state.error?.message || 'Unknown error occurred'}
            </summary>
            <div className="bg-red-100 p-3 rounded mt-2 overflow-auto">
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
          <button
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}