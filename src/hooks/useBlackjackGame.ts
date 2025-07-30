import { useState, useCallback, useEffect } from 'react';
import { cardGameApi, CardGameApiError } from '../services/cardgame-api';
import type {
  GameStateResponse,
  Player,
  DeckTypeOption,
} from '../types/cardgame';

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

  // Derived state
  const isGameStarted = gameState?.status === 'in_progress' || gameState?.status === 'finished';
  const isGameFinished = gameState?.status === 'finished';
  const currentPlayerIndex = gameState?.current_player ?? -1;
  const players = gameState?.players ?? [];
  const dealer = gameState?.dealer ?? null;
  const currentPlayer = currentPlayerIndex >= 0 && currentPlayerIndex < players.length 
    ? players[currentPlayerIndex] 
    : null;
  const remainingCards = gameState?.remaining_cards ?? 0;

  const handleError = useCallback((error: unknown) => {
    if (error instanceof CardGameApiError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const refreshGameState = useCallback(async (overrideGameId?: string) => {
    const currentGameId = overrideGameId || gameId;
    if (!currentGameId) return;

    setIsLoading(true);
    setError(null);
    try {
      const state = await cardGameApi.getGameState(currentGameId);
      setGameState(state);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, handleError]);

  const createNewGame = useCallback(async (
    decks: number = 1,
    type: DeckTypeOption = 'standard',
    maxPlayers: number = 6
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardGameApi.createGame(decks, type, maxPlayers);
      setGameId(response.game_id);
      await refreshGameState(response.game_id);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, refreshGameState]);

  const joinGame = useCallback(async (gameId: string, playerName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setGameId(gameId);
      await cardGameApi.addPlayer(gameId, playerName);
      await refreshGameState(gameId);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, refreshGameState]);

  const startGame = useCallback(async () => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.startBlackjackGame(gameId);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, refreshGameState, handleError]);

  const hit = useCallback(async () => {
    if (!gameId || !playerId) {
      setError('Game ID or Player ID not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.hit(gameId, playerId);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, playerId, refreshGameState, handleError]);

  const stand = useCallback(async () => {
    if (!gameId || !playerId) {
      setError('Game ID or Player ID not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.stand(gameId, playerId);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, playerId, refreshGameState, handleError]);

  const addPlayer = useCallback(async (playerName: string) => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.addPlayer(gameId, playerName);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, refreshGameState, handleError]);

  const removePlayer = useCallback(async (playerId: string) => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.removePlayer(gameId, playerId);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, refreshGameState, handleError]);

  const resetGame = useCallback(async () => {
    if (!gameId) {
      setError('No game ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await cardGameApi.resetDeck(gameId);
      await refreshGameState();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, refreshGameState, handleError]);

  const leaveGame = useCallback(() => {
    setGameId(null);
    setGameState(null);
    setError(null);
  }, []);

  // Auto-refresh game state periodically when game is in progress
  useEffect(() => {
    if (!gameId || !isGameStarted || isGameFinished) return;

    const interval = setInterval(() => {
      refreshGameState();
    }, 2000); // Refresh every 2 seconds

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