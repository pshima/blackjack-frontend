import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { AllTheProviders } from './TestProviders';

// Mock Zustand store for testing
const mockGameStore = {
  currentGame: null,
  currentPlayer: null,
  isLoading: false,
  error: null,
  startNewGame: vi.fn(),
  hit: vi.fn(),
  stand: vi.fn(),
  doubleDown: vi.fn(),
  split: vi.fn(),
  resetGame: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  setLoading: vi.fn(),
  loadPlayer: vi.fn(),
  updatePlayerBalance: vi.fn(),
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export specific utilities (avoid export *)
export { 
  screen, 
  fireEvent, 
  waitFor, 
  waitForElementToBeRemoved,
  within,
  getByRole,
  queryByRole,
  findByRole,
  getByText,
  queryByText,
  findByText,
  getByTestId,
  queryByTestId,
  findByTestId,
  act
} from '@testing-library/react';
export { customRender as render };

// Test utilities
export const mockStore = mockGameStore;

export const createMockPlayer = (overrides = {}) => ({
  id: 'test-player-id',
  name: 'Test Player',
  balance: 1000,
  stats: {
    gamesPlayed: 10,
    gamesWon: 6,
    totalWinnings: 500,
    winRate: 0.6,
  },
  ...overrides,
});

export const createMockCard = (overrides = {}) => ({
  suit: 'hearts' as const,
  rank: 'A' as const,
  value: 11,
  isHidden: false,
  ...overrides,
});

export const createMockHand = (overrides = {}) => ({
  cards: [createMockCard()],
  value: 11,
  isBust: false,
  isBlackjack: false,
  isSoft: true,
  ...overrides,
});

export const createMockGameState = (overrides = {}) => ({
  id: 'test-game-id',
  playerHand: createMockHand(),
  dealerHand: createMockHand({ cards: [createMockCard({ rank: '10', value: 10, isHidden: true })] }),
  deck: [],
  gameStatus: 'playing' as const,
  bet: 50,
  balance: 950,
  canDoubleDown: true,
  canSplit: false,
  ...overrides,
});

// Mock API responses
export const createMockStartGameResponse = (overrides = {}) => ({
  game: createMockGameState(),
  player: createMockPlayer(),
  ...overrides,
});

export const createMockGameActionResponse = (overrides = {}) => ({
  game: createMockGameState(),
  player: createMockPlayer(),
  ...overrides,
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock fetch responses helper
export const mockFetchResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(data),
  headers: new Headers({
    'content-type': 'application/json',
  }),
});

// Create mock error
export const createMockApiError = (status = 500, message = 'Test error') => {
  const error = new Error(message) as Error & { status: number; name: string };
  error.status = status;
  error.name = 'ApiError';
  return error;
};