import { useState, useCallback, useEffect } from 'react';
import { cardGameApi, CardGameApiError } from '../services/cardgame-api';
import type {
  GameStateResponse,
  Player,
  DeckTypeOption,
} from '../types/cardgame';

// Helper function to wrap async operations with consistent error handling and loading states
function withAsyncHandling<T extends unknown[]>(
  operation: (...args: T) => Promise<void>,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  handleError: (error: unknown) => void
) {
  return async (...args: T) => {
    setIsLoading(true);
    setError(null);
    try {
      await operation(...args);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
}

export interface UseBlackjackGameState {
  gameId: string | null;
  gameState: GameStateResponse | null;
  isLoading: boolean;
  error: string | null;
  isGameStarted: boolean;
  isGameFinished: boolean;
  currentPlayer: Player | null;
  currentPlayerIndex: number;
  dealer: Player | null;
  players: Player[];
  remainingCards: number;
}

export interface UseBlackjackGameActions {
  createNewGame: (decks?: number, type?: DeckTypeOption, maxPlayers?: number) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  hit: () => Promise<void>;
  stand: () => Promise<void>;
  addPlayer: (playerName: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  refreshGameState: () => Promise<void>;
  resetGame: () => Promise<void>;
  leaveGame: () => void;
}

export interface UseBlackjackGameReturn extends UseBlackjackGameState, UseBlackjackGameActions {}

export function useBlackjackGame(playerId?: string): UseBlackjackGameReturn {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values derived from game state for easy access
  const isGameStarted = gameState?.status === 'in_progress' || gameState?.status === 'finished';
  const isGameFinished = gameState?.status === 'finished';
  const currentPlayerIndex = gameState?.current_player ?? -1;
  const players = gameState?.players ?? [];
  const dealer = gameState?.dealer ?? null;
  const currentPlayer = currentPlayerIndex >= 0 && currentPlayerIndex < players.length 
    ? players[currentPlayerIndex] 
    : null;
  const remainingCards = gameState?.remaining_cards ?? 0;

  // Converts various error types into user-friendly error messages
  const handleError = useCallback((error: unknown) => {
    if (error instanceof CardGameApiError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  // Fetches and updates the current game state from the server
  const refreshGameState = useCallback(async (overrideGameId?: string) => {
    const currentGameId = overrideGameId || gameId;
    if (!currentGameId) return;

    await withAsyncHandling(
      async () => {
        const state = await cardGameApi.getGameState(currentGameId);
        setGameState(state);
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, handleError]);

  // Creates a new blackjack game with specified parameters
  const createNewGame = useCallback(async (
    decks: number = 1,
    type: DeckTypeOption = 'standard',
    maxPlayers: number = 6
  ) => {
    await withAsyncHandling(
      async () => {
        const response = await cardGameApi.createGame(decks, type, maxPlayers);
        setGameId(response.game_id);
        await refreshGameState(response.game_id);
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [handleError, refreshGameState]);

  // Joins an existing game as a new player
  const joinGame = useCallback(async (gameId: string, playerName: string) => {
    await withAsyncHandling(
      async () => {
        setGameId(gameId);
        await cardGameApi.addPlayer(gameId, playerName);
        await refreshGameState(gameId);
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [handleError, refreshGameState]);

  // Starts the blackjack game after players have joined
  const startGame = useCallback(async () => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.startBlackjackGame(gameId);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, refreshGameState, handleError]);

  // Player takes another card (hit action)
  const hit = useCallback(async () => {
    if (!gameId || !playerId) {
      setError('Game ID or Player ID not available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.hit(gameId, playerId);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, playerId, refreshGameState, handleError]);

  // Player keeps current hand (stand action)
  const stand = useCallback(async () => {
    if (!gameId || !playerId) {
      setError('Game ID or Player ID not available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.stand(gameId, playerId);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, playerId, refreshGameState, handleError]);

  // Adds a new player to the current game
  const addPlayer = useCallback(async (playerName: string) => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.addPlayer(gameId, playerName);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, refreshGameState, handleError]);

  // Removes a player from the current game
  const removePlayer = useCallback(async (playerId: string) => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.removePlayer(gameId, playerId);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, refreshGameState, handleError]);

  // Resets the deck for the current game
  const resetGame = useCallback(async () => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    await withAsyncHandling(
      async () => {
        await cardGameApi.resetDeck(gameId);
        await refreshGameState();
      },
      setIsLoading,
      setError,
      handleError
    )();
  }, [gameId, refreshGameState, handleError]);

  // Clears current game state to leave the game
  const leaveGame = useCallback(() => {
    setGameId(null);
    setGameState(null);
    setError(null);
  }, []);

  // Auto-refreshes game state every 2 seconds during active games
  useEffect(() => {
    if (!gameId || !isGameStarted || isGameFinished) return;

    const interval = setInterval(() => {
      refreshGameState();
    }, 2000);

    return () => clearInterval(interval);
  }, [gameId, isGameStarted, isGameFinished, refreshGameState]);

  return {
    // State
    gameId,
    gameState,
    isLoading,
    error,
    isGameStarted,
    isGameFinished,
    currentPlayer,
    currentPlayerIndex,
    dealer,
    players,
    remainingCards,
    // Actions
    createNewGame,
    joinGame,
    startGame,
    hit,
    stand,
    addPlayer,
    removePlayer,
    refreshGameState,
    resetGame,
    leaveGame,
  };
}