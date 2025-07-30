import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiService, ApiError } from '../services/api';
import type { 
  GameState, 
  Player, 
  StartGameRequest,
  GameActionResponse 
} from '../types/blackjack';

interface GameStore {
  // State
  currentGame: GameState | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: ApiError | null;
  
  // Game Actions
  startNewGame: (bet: number, playerId?: string) => Promise<void>;
  hit: () => Promise<void>;
  stand: () => Promise<void>;
  doubleDown: () => Promise<void>;
  split: () => Promise<void>;
  
  // Utility Actions
  resetGame: () => void;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Player Actions
  loadPlayer: (playerId: string) => Promise<void>;
  updatePlayerBalance: (newBalance: number) => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentGame: null,
      currentPlayer: null,
      isLoading: false,
      error: null,

      // Game Actions
      startNewGame: async (bet: number, playerId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const request: StartGameRequest = { bet, playerId };
          const response = await apiService.startGame(request);
          
          set({ 
            currentGame: response.game,
            currentPlayer: response.player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to start game');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      hit: async () => {
        const { currentGame } = get();
        if (!currentGame) {
          const error = new ApiError(400, 'No active game');
          set({ error });
          throw error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const response: GameActionResponse = await apiService.hit(currentGame.id);
          set({ 
            currentGame: response.game,
            currentPlayer: response.player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to hit');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      stand: async () => {
        const { currentGame } = get();
        if (!currentGame) {
          const error = new ApiError(400, 'No active game');
          set({ error });
          throw error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const response: GameActionResponse = await apiService.stand(currentGame.id);
          set({ 
            currentGame: response.game,
            currentPlayer: response.player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to stand');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      doubleDown: async () => {
        const { currentGame } = get();
        if (!currentGame) {
          const error = new ApiError(400, 'No active game');
          set({ error });
          throw error;
        }

        if (!currentGame.canDoubleDown) {
          const error = new ApiError(400, 'Cannot double down at this time');
          set({ error });
          throw error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const response: GameActionResponse = await apiService.doubleDown(currentGame.id);
          set({ 
            currentGame: response.game,
            currentPlayer: response.player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to double down');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      split: async () => {
        const { currentGame } = get();
        if (!currentGame) {
          const error = new ApiError(400, 'No active game');
          set({ error });
          throw error;
        }

        if (!currentGame.canSplit) {
          const error = new ApiError(400, 'Cannot split at this time');
          set({ error });
          throw error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const response: GameActionResponse = await apiService.split(currentGame.id);
          set({ 
            currentGame: response.game,
            currentPlayer: response.player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to split');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      // Utility Actions
      resetGame: () => {
        set({ 
          currentGame: null, 
          error: null,
          isLoading: false
        });
      },

      setError: (error: ApiError | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Player Actions
      loadPlayer: async (playerId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const player = await apiService.getPlayer(playerId);
          set({ 
            currentPlayer: player,
            isLoading: false 
          });
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError(0, 'Failed to load player');
          set({ 
            error: apiError,
            isLoading: false 
          });
          throw apiError;
        }
      },

      updatePlayerBalance: (newBalance: number) => {
        const { currentPlayer } = get();
        if (currentPlayer) {
          set({
            currentPlayer: {
              ...currentPlayer,
              balance: newBalance
            }
          });
        }
      },
    }),
    { 
      name: 'blackjack-game-store',
      // Only enable devtools in development
      enabled: import.meta.env.DEV
    }
  )
);

// Selectors for better performance and reusability
export const useGameState = () => useGameStore(state => state.currentGame);
export const usePlayerState = () => useGameStore(state => state.currentPlayer);
export const useGameLoading = () => useGameStore(state => state.isLoading);
export const useGameError = () => useGameStore(state => state.error);

// Action selectors
export const useGameActions = () => useGameStore(state => ({
  startNewGame: state.startNewGame,
  hit: state.hit,
  stand: state.stand,
  doubleDown: state.doubleDown,
  split: state.split,
  resetGame: state.resetGame,
  clearError: state.clearError
}));