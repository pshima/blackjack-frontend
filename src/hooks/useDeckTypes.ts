import { useState, useCallback, useEffect } from 'react';
import { cardGameApi, CardGameApiError } from '../services/cardgame-api';
import type { DeckType } from '../types/cardgame';

export interface UseDeckTypesState {
  deckTypes: DeckType[];
  isLoading: boolean;
  error: string | null;
}

export interface UseDeckTypesActions {
  refreshDeckTypes: () => Promise<void>;
}

export interface UseDeckTypesReturn extends UseDeckTypesState, UseDeckTypesActions {}

export function useDeckTypes(): UseDeckTypesReturn {
  const [deckTypes, setDeckTypes] = useState<DeckType[]>([]);
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

  const refreshDeckTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardGameApi.getDeckTypes();
      setDeckTypes(response.deck_types);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load deck types on mount
  useEffect(() => {
    refreshDeckTypes();
  }, [refreshDeckTypes]);

  return {
    deckTypes,
    isLoading,
    error,
    refreshDeckTypes,
  };
}