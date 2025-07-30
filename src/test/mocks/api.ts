import { vi } from 'vitest';
import type { 
  StartGameResponse, 
  GameActionResponse, 
  GameState, 
  Player 
} from '../../types/blackjack';
import { 
  createMockStartGameResponse,
  createMockGameActionResponse,
  createMockGameState,
  createMockPlayer
} from '../utils/test-utils';

// Mock API service
export const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  startGame: vi.fn(),
  hit: vi.fn(),
  stand: vi.fn(),
  doubleDown: vi.fn(),
  split: vi.fn(),
  getGameState: vi.fn(),
  getPlayer: vi.fn(),
  getPlayerStats: vi.fn(),
};

// Mock fetch function
export const mockFetch = vi.fn();

// Set up default mock implementations
export const setupApiMocks = () => {
  // Mock successful responses by default
  mockApiService.startGame.mockResolvedValue(createMockStartGameResponse());
  mockApiService.hit.mockResolvedValue(createMockGameActionResponse());
  mockApiService.stand.mockResolvedValue(createMockGameActionResponse());
  mockApiService.doubleDown.mockResolvedValue(createMockGameActionResponse());
  mockApiService.split.mockResolvedValue(createMockGameActionResponse());
  mockApiService.getGameState.mockResolvedValue(createMockGameState());
  mockApiService.getPlayer.mockResolvedValue(createMockPlayer());
  mockApiService.getPlayerStats.mockResolvedValue(createMockPlayer().stats);

  // Mock generic HTTP methods
  mockApiService.get.mockResolvedValue({});
  mockApiService.post.mockResolvedValue({});
  mockApiService.put.mockResolvedValue({});
  mockApiService.delete.mockResolvedValue({});

  // Mock global fetch
  global.fetch = mockFetch;
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

// Reset all mocks
export const resetApiMocks = () => {
  vi.clearAllMocks();
  Object.values(mockApiService).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
};

// Mock specific API endpoints
export const mockApiEndpoints = {
  startGame: (response?: Partial<StartGameResponse>) => {
    mockApiService.startGame.mockResolvedValue({
      ...createMockStartGameResponse(),
      ...response,
    });
  },
  
  hit: (response?: Partial<GameActionResponse>) => {
    mockApiService.hit.mockResolvedValue({
      ...createMockGameActionResponse(),
      ...response,
    });
  },
  
  stand: (response?: Partial<GameActionResponse>) => {
    mockApiService.stand.mockResolvedValue({
      ...createMockGameActionResponse(),
      ...response,
    });
  },
  
  doubleDown: (response?: Partial<GameActionResponse>) => {
    mockApiService.doubleDown.mockResolvedValue({
      ...createMockGameActionResponse(),
      ...response,
    });
  },
  
  split: (response?: Partial<GameActionResponse>) => {
    mockApiService.split.mockResolvedValue({
      ...createMockGameActionResponse(),
      ...response,
    });
  },
  
  getGameState: (response?: Partial<GameState>) => {
    mockApiService.getGameState.mockResolvedValue({
      ...createMockGameState(),
      ...response,
    });
  },
  
  getPlayer: (response?: Partial<Player>) => {
    mockApiService.getPlayer.mockResolvedValue({
      ...createMockPlayer(),
      ...response,
    });
  },
};

// Mock API errors
export const mockApiError = (status = 500, message = 'API Error') => {
  const error = new Error(message) as any;
  error.status = status;
  error.name = 'ApiError';
  return error;
};