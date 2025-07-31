import { config } from '../config/environment';
import type {
  ErrorResponse,
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

// Custom error class for API-specific errors with status codes and categorization
export class CardGameApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'CardGameApiError';
    this.status = status;
    this.details = details;
  }

  // Returns true if error is due to network connectivity issues
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  // Returns true for 4xx HTTP status codes (client errors)
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  // Returns true for 5xx HTTP status codes (server errors)
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// Main API service class for card game operations with type safety and error handling
class CardGameApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
    this.timeout = config.apiTimeout;
  }

  // Helper function to build endpoint URLs with optional parameters
  private buildEndpoint(base: string, ...params: (string | number | undefined)[]): string {
    const validParams = params.filter(p => p !== undefined);
    return validParams.length > 0 ? `${base}/${validParams.join('/')}` : base;
  }

  // Core HTTP request method with timeout, logging, and error handling
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

  // Checks if the API server is responding correctly
  async healthCheck(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/hello');
  }

  // Fetches available deck types from the server
  async getDeckTypes(): Promise<DeckTypesResponse> {
    return this.request<DeckTypesResponse>('/deck-types');
  }

  // Creates a new game with specified deck count, type, and player limit
  async createGame(
    decks: number = 1,
    type: DeckTypeOption = 'standard',
    maxPlayers?: number
  ): Promise<GameCreationResponse | GameCreationWithPlayersResponse> {
    const params = [];
    
    if (decks !== 1) {
      params.push(decks);
      if (type !== 'standard') {
        params.push(type);
        if (maxPlayers !== undefined) {
          params.push(maxPlayers);
        }
      }
    }

    const endpoint = this.buildEndpoint('/game/new', ...params);
    return this.request<GameCreationResponse | GameCreationWithPlayersResponse>(endpoint);
  }

  // Retrieves a list of all active games
  async listGames(): Promise<GameListResponse> {
    return this.request<GameListResponse>('/games');
  }

  // Gets detailed information about a specific game
  async getGame(gameId: string): Promise<GameInfoResponse> {
    return this.request<GameInfoResponse>(`/game/${gameId}`);
  }

  // Deletes a game permanently from the server
  async deleteGame(gameId: string): Promise<{ message: string; game_id: string }> {
    return this.request<{ message: string; game_id: string }>(`/game/${gameId}`, {
      method: 'DELETE',
    });
  }

  // Fetches the current state of a game including players and cards
  async getGameState(gameId: string): Promise<GameStateResponse> {
    return this.request<GameStateResponse>(`/game/${gameId}/state`);
  }

  // Shuffles the deck for a specific game
  async shuffleDeck(gameId: string): Promise<DeckOperationResponse> {
    return this.request<DeckOperationResponse>(`/game/${gameId}/shuffle`);
  }

  // Resets the deck with optional new configuration
  async resetDeck(
    gameId: string,
    decks?: number,
    type?: DeckTypeOption
  ): Promise<DeckOperationResponse | DeckResetResponse> {
    const endpoint = this.buildEndpoint(`/game/${gameId}/reset`, decks, type);
    return this.request<DeckOperationResponse | DeckResetResponse>(endpoint);
  }

  // Adds a new player to an existing game
  async addPlayer(gameId: string, playerName: string): Promise<PlayerAddedResponse> {
    const request: AddPlayerRequest = { name: playerName };
    return this.request<PlayerAddedResponse>(`/game/${gameId}/players`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Removes a player from the game
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

  // Deals a single card from the deck
  async dealCard(gameId: string): Promise<SingleCardResponse> {
    return this.request<SingleCardResponse>(`/game/${gameId}/deal`);
  }

  // Deals multiple cards from the deck
  async dealCards(gameId: string, count: number): Promise<MultipleCardsResponse> {
    return this.request<MultipleCardsResponse>(`/game/${gameId}/deal/${count}`);
  }

  // Deals a card directly to a specific player, optionally face up or down
  async dealCardToPlayer(
    gameId: string,
    playerId: string,
    faceUp?: boolean
  ): Promise<PlayerCardResponse | PlayerCardWithFaceResponse> {
    const endpoint = this.buildEndpoint(`/game/${gameId}/deal/player/${playerId}`, faceUp);
    return this.request<PlayerCardResponse | PlayerCardWithFaceResponse>(endpoint);
  }

  // Discards a card from a player's hand to a discard pile
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

  // Starts a blackjack game and deals initial cards to all players
  async startBlackjackGame(gameId: string): Promise<BlackjackStartResponse> {
    return this.request<BlackjackStartResponse>(`/game/${gameId}/start`, {
      method: 'POST',
    });
  }

  // Player takes another card in blackjack
  async hit(gameId: string, playerId: string): Promise<BlackjackHitResponse> {
    return this.request<BlackjackHitResponse>(`/game/${gameId}/hit/${playerId}`, {
      method: 'POST',
    });
  }

  // Player stands with their current hand in blackjack
  async stand(gameId: string, playerId: string): Promise<BlackjackStandResponse> {
    return this.request<BlackjackStandResponse>(`/game/${gameId}/stand/${playerId}`, {
      method: 'POST',
    });
  }

  // Retrieves the final results of a completed blackjack game
  async getBlackjackResults(gameId: string): Promise<BlackjackResultsResponse> {
    return this.request<BlackjackResultsResponse>(`/game/${gameId}/results`);
  }
}

export const cardGameApi = new CardGameApiService();
export default CardGameApiService;