import { useState, useCallback, useEffect } from 'react';
import { cardGameApi, CardGameApiError } from '../services/cardgame-api';

export interface UseGameListState {
  games: string[];
  gameCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface UseGameListActions {
  refreshGameList: () => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
}

export interface UseGameListReturn extends UseGameListState, UseGameListActions {}

export function useGameList(autoRefresh: boolean = false): UseGameListReturn {
  const [games, setGames] = useState<string[]>([]);
  const [gameCount, setGameCount] = useState(0);
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

  const refreshGameList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardGameApi.listGames();
      setGames(response.games);
      setGameCount(response.game_count);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteGame = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.deleteGame(gameId);
      await refreshGameList();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshGameList]);

  // Initial load
  useEffect(() => {
    refreshGameList();
  }, [refreshGameList]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshGameList();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshGameList]);

  return {
    games,
    gameCount,
    isLoading,
    error,
    refreshGameList,
    deleteGame,
  };
}