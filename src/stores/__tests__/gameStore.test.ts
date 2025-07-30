import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameStore, useGameState, usePlayerState, useGameLoading, useGameError, useGameActions } from '../gameStore';
import { ApiError } from '../../services/api';
import { createMockStartGameResponse, createMockGameActionResponse, createMockGameState, createMockPlayer } from '../../test/utils/test-utils';

// Mock the API service
const mockApiService = {
  startGame: vi.fn(),
  hit: vi.fn(),
  stand: vi.fn(),
  doubleDown: vi.fn(),
  split: vi.fn(),
  getPlayer: vi.fn(),
};

vi.mock('../../services/api', () => ({
  apiService: mockApiService,
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string, public code?: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('gameStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.currentGame).toBeNull();
      expect(result.current.currentPlayer).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('startNewGame', () => {
    it('should start a new game successfully', async () => {
      const mockResponse = createMockStartGameResponse();
      mockApiService.startGame.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.startNewGame(50, 'player123');
      });

      expect(result.current.currentGame).toEqual(mockResponse.game);
      expect(result.current.currentPlayer).toEqual(mockResponse.player);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApiService.startGame).toHaveBeenCalledWith({ bet: 50, playerId: 'player123' });
    });

    it('should handle start game errors', async () => {
      const mockError = new ApiError(400, 'Invalid bet amount');
      mockApiService.startGame.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.startNewGame(-10)).rejects.toEqual(mockError);
      });

      expect(result.current.currentGame).toBeNull();
      expect(result.current.currentPlayer).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });

    it('should handle non-ApiError errors in startNewGame', async () => {
      const mockError = new Error('Generic error');
      mockApiService.startGame.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.startNewGame(50)).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.message).toBe('Failed to start game');
    });

    it('should set loading state during startNewGame', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiService.startGame.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useGameStore());

      // Start the game (don't await yet)
      const gamePromise = act(async () => {
        return result.current.startNewGame(50);
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve the promise
      resolvePromise!(createMockStartGameResponse());
      await gamePromise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('hit', () => {
    it('should hit successfully when game is active', async () => {
      const mockResponse = createMockGameActionResponse();
      mockApiService.hit.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGameStore());

      // Set up initial game state
      act(() => {
        result.current.currentGame = createMockGameState();
      });

      await act(async () => {
        await result.current.hit();
      });

      expect(result.current.currentGame).toEqual(mockResponse.game);
      expect(result.current.currentPlayer).toEqual(mockResponse.player);
      expect(result.current.error).toBeNull();
      expect(mockApiService.hit).toHaveBeenCalledWith('test-game-id');
    });

    it('should throw error when no active game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.hit()).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error?.message).toBe('No active game');
      expect(result.current.error?.status).toBe(400);
    });

    it('should handle hit API errors', async () => {
      const mockError = new ApiError(500, 'Server error');
      mockApiService.hit.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGameStore());

      // Set up initial game state
      act(() => {
        result.current.currentGame = createMockGameState();
      });

      await act(async () => {
        await expect(result.current.hit()).rejects.toEqual(mockError);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('stand', () => {
    it('should stand successfully when game is active', async () => {
      const mockResponse = createMockGameActionResponse();
      mockApiService.stand.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGameStore());

      // Set up initial game state
      act(() => {
        result.current.currentGame = createMockGameState();
      });

      await act(async () => {
        await result.current.stand();
      });

      expect(result.current.currentGame).toEqual(mockResponse.game);
      expect(result.current.currentPlayer).toEqual(mockResponse.player);
      expect(mockApiService.stand).toHaveBeenCalledWith('test-game-id');
    });

    it('should throw error when no active game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.stand()).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error?.message).toBe('No active game');
    });
  });

  describe('doubleDown', () => {
    it('should double down successfully when allowed', async () => {
      const mockResponse = createMockGameActionResponse();
      mockApiService.doubleDown.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGameStore());

      // Set up game state that allows double down
      act(() => {
        result.current.currentGame = createMockGameState({ canDoubleDown: true });
      });

      await act(async () => {
        await result.current.doubleDown();
      });

      expect(result.current.currentGame).toEqual(mockResponse.game);
      expect(mockApiService.doubleDown).toHaveBeenCalledWith('test-game-id');
    });

    it('should throw error when double down not allowed', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up game state that doesn't allow double down
      act(() => {
        result.current.currentGame = createMockGameState({ canDoubleDown: false });
      });

      await act(async () => {
        await expect(result.current.doubleDown()).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error?.message).toBe('Cannot double down at this time');
    });

    it('should throw error when no active game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.doubleDown()).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error?.message).toBe('No active game');
    });
  });

  describe('split', () => {
    it('should split successfully when allowed', async () => {
      const mockResponse = createMockGameActionResponse();
      mockApiService.split.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGameStore());

      // Set up game state that allows split
      act(() => {
        result.current.currentGame = createMockGameState({ canSplit: true });
      });

      await act(async () => {
        await result.current.split();
      });

      expect(result.current.currentGame).toEqual(mockResponse.game);
      expect(mockApiService.split).toHaveBeenCalledWith('test-game-id');
    });

    it('should throw error when split not allowed', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up game state that doesn't allow split
      act(() => {
        result.current.currentGame = createMockGameState({ canSplit: false });
      });

      await act(async () => {
        await expect(result.current.split()).rejects.toBeInstanceOf(ApiError);
      });

      expect(result.current.error?.message).toBe('Cannot split at this time');
    });
  });

  describe('utility actions', () => {
    it('should reset game state', () => {
      const { result } = renderHook(() => useGameStore());

      // Set some state first
      act(() => {
        result.current.currentGame = createMockGameState();
        result.current.error = new ApiError(500, 'Test error');
        result.current.isLoading = true;
      });

      // Reset the game
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.currentGame).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set and clear errors', () => {
      const { result } = renderHook(() => useGameStore());
      const testError = new ApiError(400, 'Test error');

      // Set error
      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toEqual(testError);

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useGameStore());

      // Set loading to true
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Set loading to false
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('player actions', () => {
    it('should load player successfully', async () => {
      const mockPlayer = createMockPlayer();
      mockApiService.getPlayer.mockResolvedValue(mockPlayer);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.loadPlayer('player123');
      });

      expect(result.current.currentPlayer).toEqual(mockPlayer);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApiService.getPlayer).toHaveBeenCalledWith('player123');
    });

    it('should handle load player errors', async () => {
      const mockError = new ApiError(404, 'Player not found');
      mockApiService.getPlayer.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await expect(result.current.loadPlayer('invalid-id')).rejects.toEqual(mockError);
      });

      expect(result.current.currentPlayer).toBeNull();
      expect(result.current.error).toEqual(mockError);
    });

    it('should update player balance', () => {
      const { result } = renderHook(() => useGameStore());

      // Set initial player
      act(() => {
        result.current.currentPlayer = createMockPlayer({ balance: 1000 });
      });

      // Update balance
      act(() => {
        result.current.updatePlayerBalance(1500);
      });

      expect(result.current.currentPlayer?.balance).toBe(1500);
    });

    it('should not update balance when no player is set', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.currentPlayer).toBeNull();

      // Try to update balance
      act(() => {
        result.current.updatePlayerBalance(1500);
      });

      expect(result.current.currentPlayer).toBeNull();
    });
  });

  describe('selectors', () => {
    it('should return current game state', () => {
      const mockGame = createMockGameState();
      
      // Set game state
      act(() => {
        useGameStore.setState({ currentGame: mockGame });
      });

      const { result } = renderHook(() => useGameState());
      expect(result.current).toEqual(mockGame);
    });

    it('should return current player state', () => {
      const mockPlayer = createMockPlayer();
      
      // Set player state
      act(() => {
        useGameStore.setState({ currentPlayer: mockPlayer });
      });

      const { result } = renderHook(() => usePlayerState());
      expect(result.current).toEqual(mockPlayer);
    });

    it('should return loading state', () => {
      act(() => {
        useGameStore.setState({ isLoading: true });
      });

      const { result } = renderHook(() => useGameLoading());
      expect(result.current).toBe(true);
    });

    it('should return error state', () => {
      const mockError = new ApiError(500, 'Test error');
      
      act(() => {
        useGameStore.setState({ error: mockError });
      });

      const { result } = renderHook(() => useGameError());
      expect(result.current).toEqual(mockError);
    });

    it('should return game actions', () => {
      const { result } = renderHook(() => useGameActions());

      expect(typeof result.current.startNewGame).toBe('function');
      expect(typeof result.current.hit).toBe('function');
      expect(typeof result.current.stand).toBe('function');
      expect(typeof result.current.doubleDown).toBe('function');
      expect(typeof result.current.split).toBe('function');
      expect(typeof result.current.resetGame).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('error handling consistency', () => {
    it('should clear error state when starting successful operations', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set an initial error
      act(() => {
        result.current.setError(new ApiError(400, 'Previous error'));
      });

      expect(result.current.error).not.toBeNull();

      // Mock successful startGame
      const mockResponse = createMockStartGameResponse();
      mockApiService.startGame.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.startNewGame(50);
      });

      expect(result.current.error).toBeNull();
    });

    it('should preserve previous game state when operations fail', async () => {
      const { result } = renderHook(() => useGameStore());
      const initialGame = createMockGameState();

      // Set initial game state
      act(() => {
        result.current.currentGame = initialGame;
      });

      // Mock failed hit
      const mockError = new ApiError(500, 'Server error');
      mockApiService.hit.mockRejectedValue(mockError);

      await act(async () => {
        await expect(result.current.hit()).rejects.toEqual(mockError);
      });

      // Game state should remain unchanged
      expect(result.current.currentGame).toEqual(initialGame);
      expect(result.current.error).toEqual(mockError);
    });
  });
});