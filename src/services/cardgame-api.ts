import { config } from '../config/environment';
import type {
  ErrorResponse,
  DeckType,
  DeckTypesResponse,
  GameCreationResponse,
  GameCreationWithPlayersResponse,
  GameInfoResponse,
  GameStateResponse,
  GameListResponse,
  DeckOperationResponse,
  DeckResetResponse,
  PlayerAddedResponse,
  SingleCardResponse,
  MultipleCardsResponse,
  PlayerCardResponse,
  PlayerCardWithFaceResponse,
  DiscardResponse,
  BlackjackStartResponse,
  BlackjackHitResponse,
  BlackjackStandResponse,
  BlackjackResultsResponse,
  AddPlayerRequest,
  DiscardCardRequest,
  DeckTypeOption,
} from '../types/cardgame';

export class CardGameApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'CardGameApiError';
    this.status = status;
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

class CardGameApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
    this.timeout = config.apiTimeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();

    const requestConfig: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
      ...options,
    };

    try {
      const response = await fetch(url, requestConfig);
      const duration = performance.now() - startTime;

      console.log(`API ${method} ${endpoint} - ${response.status} (${duration}ms)`);

      if (!response.ok) {
        let errorData: ErrorResponse = { error: `HTTP error! status: ${response.status}` };

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          }
        } catch {
          // If JSON parsing fails, use default error message
        }

        throw new CardGameApiError(
          response.status,
          errorData.error || `HTTP error! status: ${response.status}`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      const duration = performance.now() - startTime;

      if (error instanceof CardGameApiError) {
        console.log(`API ${method} ${endpoint} - ${error.status} (${duration}ms)`);
        throw error;
      }

      // Network or other errors
      console.error('Card Game API request failed:', error, { url, duration });

      throw new CardGameApiError(
        0,
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  // System endpoints
  async healthCheck(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/hello');
  }

  // Deck type endpoints
  async getDeckTypes(): Promise<DeckTypesResponse> {
    return this.request<DeckTypesResponse>('/deck-types');
  }

  // Game management endpoints
  async createGame(
    decks: number = 1,
    type: DeckTypeOption = 'standard',
    maxPlayers?: number
  ): Promise<GameCreationResponse | GameCreationWithPlayersResponse> {
    let endpoint = '/game/new';
    
    if (decks !== 1) {
      endpoint += `/${decks}`;
      if (type !== 'standard') {
        endpoint += `/${type}`;
        if (maxPlayers !== undefined) {
          endpoint += `/${maxPlayers}`;
        }
      }
    }

    return this.request<GameCreationResponse | GameCreationWithPlayersResponse>(endpoint);
  }

  async listGames(): Promise<GameListResponse> {
    return this.request<GameListResponse>('/games');
  }

  async getGame(gameId: string): Promise<GameInfoResponse> {
    return this.request<GameInfoResponse>(`/game/${gameId}`);
  }

  async deleteGame(gameId: string): Promise<{ message: string; game_id: string }> {
    return this.request<{ message: string; game_id: string }>(`/game/${gameId}`, {
      method: 'DELETE',
    });
  }

  // Game state endpoints
  async getGameState(gameId: string): Promise<GameStateResponse> {
    return this.request<GameStateResponse>(`/game/${gameId}/state`);
  }

  async shuffleDeck(gameId: string): Promise<DeckOperationResponse> {
    return this.request<DeckOperationResponse>(`/game/${gameId}/shuffle`);
  }

  async resetDeck(
    gameId: string,
    decks?: number,
    type?: DeckTypeOption
  ): Promise<DeckOperationResponse | DeckResetResponse> {
    let endpoint = `/game/${gameId}/reset`;
    
    if (decks !== undefined) {
      endpoint += `/${decks}`;
      if (type !== undefined) {
        endpoint += `/${type}`;
      }
    }

    return this.request<DeckOperationResponse | DeckResetResponse>(endpoint);
  }

  // Player management endpoints
  async addPlayer(gameId: string, playerName: string): Promise<PlayerAddedResponse> {
    const request: AddPlayerRequest = { name: playerName };
    return this.request<PlayerAddedResponse>(`/game/${gameId}/players`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async removePlayer(gameId: string, playerId: string): Promise<{
    game_id: string;
    player_id: string;
    message: string;
  }> {
    return this.request<{
      game_id: string;
      player_id: string;
      message: string;
    }>(`/game/${gameId}/players/${playerId}`, {
      method: 'DELETE',
    });
  }

  // Card dealing endpoints
  async dealCard(gameId: string): Promise<SingleCardResponse> {
    return this.request<SingleCardResponse>(`/game/${gameId}/deal`);
  }

  async dealCards(gameId: string, count: number): Promise<MultipleCardsResponse> {
    return this.request<MultipleCardsResponse>(`/game/${gameId}/deal/${count}`);
  }

  async dealCardToPlayer(
    gameId: string,
    playerId: string,
    faceUp?: boolean
  ): Promise<PlayerCardResponse | PlayerCardWithFaceResponse> {
    let endpoint = `/game/${gameId}/deal/player/${playerId}`;
    
    if (faceUp !== undefined) {
      endpoint += `/${faceUp}`;
    }

    return this.request<PlayerCardResponse | PlayerCardWithFaceResponse>(endpoint);
  }

  // Discard operations
  async discardCard(
    gameId: string,
    pileId: string,
    playerId: string,
    cardIndex: number
  ): Promise<DiscardResponse> {
    const request: DiscardCardRequest = {
      player_id: playerId,
      card_index: cardIndex,
    };
    return this.request<DiscardResponse>(`/game/${gameId}/discard/${pileId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Blackjack gameplay endpoints
  async startBlackjackGame(gameId: string): Promise<BlackjackStartResponse> {
    return this.request<BlackjackStartResponse>(`/game/${gameId}/start`, {
      method: 'POST',
    });
  }

  async hit(gameId: string, playerId: string): Promise<BlackjackHitResponse> {
    return this.request<BlackjackHitResponse>(`/game/${gameId}/hit/${playerId}`, {
      method: 'POST',
    });
  }

  async stand(gameId: string, playerId: string): Promise<BlackjackStandResponse> {
    return this.request<BlackjackStandResponse>(`/game/${gameId}/stand/${playerId}`, {
      method: 'POST',
    });
  }

  async getBlackjackResults(gameId: string): Promise<BlackjackResultsResponse> {
    return this.request<BlackjackResultsResponse>(`/game/${gameId}/results`);
  }
}

export const cardGameApi = new CardGameApiService();
export default CardGameApiService;