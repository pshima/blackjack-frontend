import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ApiService, { ApiError, apiService } from '../api';
import { mockFetchResponse, createMockStartGameResponse, createMockGameActionResponse } from '../../test/utils/test-utils';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiError', () => {
  it('should create an ApiError with correct properties', () => {
    const error = new ApiError(404, 'Not Found', 'NOT_FOUND', { detail: 'Resource not found' });
    
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual({ detail: 'Resource not found' });
  });

  it('should identify network errors correctly', () => {
    const networkError = new ApiError(0, 'Network error');
    const clientError = new ApiError(400, 'Bad request');
    const serverError = new ApiError(500, 'Server error');

    expect(networkError.isNetworkError).toBe(true);
    expect(clientError.isNetworkError).toBe(false);
    expect(serverError.isNetworkError).toBe(false);
  });

  it('should identify client errors correctly', () => {
    const networkError = new ApiError(0, 'Network error');
    const clientError = new ApiError(400, 'Bad request');
    const serverError = new ApiError(500, 'Server error');

    expect(networkError.isClientError).toBe(false);
    expect(clientError.isClientError).toBe(true);
    expect(serverError.isClientError).toBe(false);
  });

  it('should identify server errors correctly', () => {
    const networkError = new ApiError(0, 'Network error');
    const clientError = new ApiError(400, 'Bad request');
    const serverError = new ApiError(500, 'Server error');

    expect(networkError.isServerError).toBe(false);
    expect(clientError.isServerError).toBe(false);
    expect(serverError.isServerError).toBe(true);
  });
});

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    service = new ApiService('http://test-api.com');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use provided base URL', () => {
      const customService = new ApiService('http://custom.api.com');
      expect(customService).toBeInstanceOf(ApiService);
    });

    it('should use default base URL when none provided', () => {
      const defaultService = new ApiService();
      expect(defaultService).toBeInstanceOf(ApiService);
    });
  });

  describe('request method', () => {
    it('should make successful requests', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue(mockFetchResponse(mockData));

      const result = await service.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      expect(result).toEqual(mockData);
    });

    it('should handle HTTP errors with JSON response', async () => {
      const errorData = { message: 'Not found', code: 'NOT_FOUND' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(errorData),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(service.get('/test')).rejects.toThrow(ApiError);
      await expect(service.get('/test')).rejects.toThrow('Not found');
    });

    it('should handle HTTP errors without JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers({ 'content-type': 'text/html' }),
      });

      await expect(service.get('/test')).rejects.toThrow(ApiError);
      await expect(service.get('/test')).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failed'));

      await expect(service.get('/test')).rejects.toThrow(ApiError);
      
      const error = await service.get('/test').catch(e => e);
      expect(error.status).toBe(0);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should include custom headers', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue(mockFetchResponse(mockData));

      await service.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(mockFetchResponse({}));
    });

    it('should make GET requests', async () => {
      await service.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should make POST requests', async () => {
      const data = { test: 'data' };
      await service.post('/test', data);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    });

    it('should make PUT requests', async () => {
      const data = { test: 'data' };
      await service.put('/test', data);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    });

    it('should make DELETE requests', async () => {
      await service.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/test', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Blackjack-specific methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(mockFetchResponse({}));
    });

    it('should start a new game', async () => {
      const request = { bet: 50, playerId: 'player123' };
      const mockResponse = createMockStartGameResponse();
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await service.startGame(request);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should hit in a game', async () => {
      const gameId = 'game123';
      const mockResponse = createMockGameActionResponse();
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await service.hit(gameId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/game123/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should stand in a game', async () => {
      const gameId = 'game123';
      const mockResponse = createMockGameActionResponse();
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await service.stand(gameId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/game123/stand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should double down in a game', async () => {
      const gameId = 'game123';
      const mockResponse = createMockGameActionResponse();
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await service.doubleDown(gameId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/game123/double', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should split in a game', async () => {
      const gameId = 'game123';
      const mockResponse = createMockGameActionResponse();
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await service.split(gameId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/game123/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get game state', async () => {
      const gameId = 'game123';
      const mockGameState = { id: gameId, gameStatus: 'playing' };
      mockFetch.mockResolvedValue(mockFetchResponse(mockGameState));

      const result = await service.getGameState(gameId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/game/game123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockGameState);
    });

    it('should get player information', async () => {
      const playerId = 'player123';
      const mockPlayer = { id: playerId, name: 'Test Player' };
      mockFetch.mockResolvedValue(mockFetchResponse(mockPlayer));

      const result = await service.getPlayer(playerId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/player/player123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should get player stats', async () => {
      const playerId = 'player123';
      const mockStats = { gamesPlayed: 10, gamesWon: 6 };
      mockFetch.mockResolvedValue(mockFetchResponse(mockStats));

      const result = await service.getPlayerStats(playerId);

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/player/player123/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockStats);
    });
  });

  describe('error handling in blackjack methods', () => {
    it('should propagate errors from startGame', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'Invalid bet amount' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(service.startGame({ bet: -10 })).rejects.toThrow('Invalid bet amount');
    });

    it('should propagate network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection failed'));

      await expect(service.hit('game123')).rejects.toThrow(ApiError);
    });
  });
});

describe('default apiService instance', () => {
  it('should be an instance of ApiService', () => {
    expect(apiService).toBeInstanceOf(ApiService);
  });

  it('should have all required methods', () => {
    expect(typeof apiService.get).toBe('function');
    expect(typeof apiService.post).toBe('function');
    expect(typeof apiService.put).toBe('function');
    expect(typeof apiService.delete).toBe('function');
    expect(typeof apiService.startGame).toBe('function');
    expect(typeof apiService.hit).toBe('function');
    expect(typeof apiService.stand).toBe('function');
    expect(typeof apiService.doubleDown).toBe('function');
    expect(typeof apiService.split).toBe('function');
    expect(typeof apiService.getGameState).toBe('function');
    expect(typeof apiService.getPlayer).toBe('function');
    expect(typeof apiService.getPlayerStats).toBe('function');
  });
});