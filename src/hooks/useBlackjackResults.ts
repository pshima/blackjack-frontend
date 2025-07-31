import { useState, useCallback } from 'react';
import { cardGameApi, CardGameApiError } from '../services/cardgame-api';
import type { GlitchjackResultsResponse } from '../types/cardgame';

export interface UseBlackjackResultsState {
  results: GlitchjackResultsResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseBlackjackResultsActions {
  fetchResults: (gameId: string) => Promise<void>;
  clearResults: () => void;
}

export interface UseBlackjackResultsReturn extends UseBlackjackResultsState, UseBlackjackResultsActions {}

export function useBlackjackResults(): UseBlackjackResultsReturn {
  const [results, setResults] = useState<GlitchjackResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof CardGameApiError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const fetchResults = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardGameApi.getGlitchjackResults(gameId);
      setResults(response);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    fetchResults,
    clearResults,
  };
}