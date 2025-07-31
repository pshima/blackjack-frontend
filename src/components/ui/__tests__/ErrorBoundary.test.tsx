import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
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

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});