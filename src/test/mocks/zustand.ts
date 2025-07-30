import { vi } from 'vitest';
import type { GameStore } from '../../stores/gameStore';
import { createMockGameState, createMockPlayer } from '../utils/test-utils';

// Create a mock Zustand store
export const createMockGameStore = (initialState: Partial<GameStore> = {}): GameStore => ({
  // Initial state
  currentGame: null,
  currentPlayer: null,
  isLoading: false,
  error: null,
  
  // Game actions
  startNewGame: vi.fn(),
  hit: vi.fn(),
  stand: vi.fn(),
  doubleDown: vi.fn(),
  split: vi.fn(),
  
  // Utility actions
  resetGame: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  
  // Player actions
  loadPlayer: vi.fn(),
  updatePlayerBalance: vi.fn(),
  
  // Override with any provided initial state
  ...initialState,
});

// Mock the useGameStore hook
export const mockUseGameStore = vi.fn();

// Mock selectors
export const mockUseGameState = vi.fn();
export const mockUsePlayerState = vi.fn();
export const mockUseGameLoading = vi.fn();
export const mockUseGameError = vi.fn();
export const mockUseGameActions = vi.fn();

// Setup default mock implementations
export const setupZustandMocks = () => {
  const mockStore = createMockGameStore();
  
  mockUseGameStore.mockImplementation((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  });
  
  mockUseGameState.mockReturnValue(null);
  mockUsePlayerState.mockReturnValue(null);
  mockUseGameLoading.mockReturnValue(false);
  mockUseGameError.mockReturnValue(null);
  mockUseGameActions.mockReturnValue({
    startNewGame: mockStore.startNewGame,
    hit: mockStore.hit,
    stand: mockStore.stand,
    doubleDown: mockStore.doubleDown,
    split: mockStore.split,
    resetGame: mockStore.resetGame,
    clearError: mockStore.clearError,
  });
  
  return mockStore;
};

// Reset Zustand mocks
export const resetZustandMocks = () => {
  mockUseGameStore.mockClear();
  mockUseGameState.mockClear();
  mockUsePlayerState.mockClear();
  mockUseGameLoading.mockClear();
  mockUseGameError.mockClear();
  mockUseGameActions.mockClear();
};

// Mock store with specific state
export const mockStoreWithState = (state: Partial<GameStore>) => {
  const mockStore = createMockGameStore(state);
  mockUseGameStore.mockImplementation((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  });
  return mockStore;
};