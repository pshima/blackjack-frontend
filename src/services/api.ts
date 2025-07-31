import type { 
  StartGameRequest, 
  StartGameResponse, 
  GameActionResponse,
  GameState,
  Player 
} from '../types/blackjack';
import { config } from '../config/environment';
import { logger } from './monitoring';
import { validateGameId, validationSchemas, createValidationMiddleware } from '../utils/validation';

export class ApiError extends Error {
  public status: number;
  public code?: string; 
  public details?: unknown;

  constructor(
    status: number, 
    message: string, 
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
    this.timeout = config.apiTimeout;
    this.retryAttempts = config.apiRetryAttempts;
    this.retryDelay = config.apiRetryDelay;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();
    
    // Add headers
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
      'X-Client-Version': config.appVersion,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };
    
    const requestConfig: RequestInit = {
      headers,
      signal: AbortSignal.timeout(this.timeout),
      ...options,
    };

    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(url, requestConfig);
        const duration = performance.now() - startTime;
        
        // Log API call performance
        logger.apiCall(method, endpoint, duration, response.status);
        
        if (!response.ok) {
          let errorData: ErrorResponse = { message: `HTTP error! status: ${response.status}` };
          
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            }
          } catch {
            // If JSON parsing fails, use default error message
          }
          
          throw new ApiError(
            response.status,
            errorData.message || `HTTP error! status: ${response.status}`,
            errorData.code,
            errorData.details
          );
        }
        
        return await response.json();
      } catch (error) {
        const duration = performance.now() - startTime;
        
        if (error instanceof ApiError) {
          logger.apiCall(method, endpoint, duration, error.status);
          throw error;
        }
        
        // Network or other errors
        logger.error('API request failed', error as Error, {
          action: `${method} ${endpoint}`,
          metadata: { url, duration }
        });
        
        throw new ApiError(
          0, 
          error instanceof Error ? error.message : 'Network error occurred',
          'NETWORK_ERROR'
        );
      }
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry client errors (4xx) or if we've exhausted attempts
        if (error instanceof ApiError && (error.isClientError || attempt === this.retryAttempts)) {
          throw error;
        }
        
        if (attempt < this.retryAttempts) {
          logger.warn(`API request attempt ${attempt + 1} failed, retrying in ${this.retryDelay}ms...`, {
            metadata: { attempt: attempt + 1, maxAttempts: this.retryAttempts }
          });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw lastError!;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Blackjack-specific API methods
  async startGame(request: StartGameRequest): Promise<StartGameResponse> {
    // Validate request data
    const validator = createValidationMiddleware(validationSchemas.startGame);
    const validation = validator(request);
    
    if (!validation.isValid) {
      throw new ApiError(400, `Invalid start game request: ${validation.errors.join(', ')}`);
    }
    
    return this.post<StartGameResponse>('/game/start', validation.sanitized);
  }

  async hit(gameId: string): Promise<GameActionResponse> {
    const gameIdValidation = validateGameId(gameId);
    if (!gameIdValidation.isValid) {
      throw new ApiError(400, `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    
    return this.post<GameActionResponse>(`/game/${gameIdValidation.sanitized}/hit`, {});
  }

  async stand(gameId: string): Promise<GameActionResponse> {
    const gameIdValidation = validateGameId(gameId);
    if (!gameIdValidation.isValid) {
      throw new ApiError(400, `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    
    return this.post<GameActionResponse>(`/game/${gameIdValidation.sanitized}/stand`, {});
  }

  async doubleDown(gameId: string): Promise<GameActionResponse> {
    const gameIdValidation = validateGameId(gameId);
    if (!gameIdValidation.isValid) {
      throw new ApiError(400, `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    
    return this.post<GameActionResponse>(`/game/${gameIdValidation.sanitized}/double`, {});
  }

  async split(gameId: string): Promise<GameActionResponse> {
    const gameIdValidation = validateGameId(gameId);
    if (!gameIdValidation.isValid) {
      throw new ApiError(400, `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    
    return this.post<GameActionResponse>(`/game/${gameIdValidation.sanitized}/split`, {});
  }

  async getGameState(gameId: string): Promise<GameState> {
    return this.get<GameState>(`/game/${gameId}`);
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.get<Player>(`/player/${playerId}`);
  }

  async getPlayerStats(playerId: string): Promise<Player['stats']> {
    return this.get<Player['stats']>(`/player/${playerId}/stats`);
  }
}

export const apiService = new ApiService();
export default ApiService;