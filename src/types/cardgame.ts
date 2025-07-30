// Card Game API Types
// Based on Card Game API OpenAPI specification

export interface ErrorResponse {
  error: string;
}

export interface DeckType {
  id: number;
  type: string;
  name: string;
  description: string;
  cards_per_deck: number;
}

export interface CardImages {
  icon: string;  // 32x48
  small: string; // 64x90
  large: string; // 200x280
}

export interface Card {
  rank: number;  // 1=Ace, 11=Jack, 12=Queen, 13=King
  suit: number;  // 0=Hearts, 1=Diamonds, 2=Clubs, 3=Spades
  face_up: boolean;
  images?: CardImages;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  hand_size: number;
  hand_value?: number;
  has_blackjack?: boolean;
  is_busted?: boolean;
}

export interface DiscardPile {
  id: string;
  name: string;
  size: number;
  cards: Card[];
}

export type GameStatus = 'waiting' | 'in_progress' | 'finished';

export interface GameCreationResponse {
  game_id: string;
  deck_name: string;
  deck_type: string;
  message: string;
  remaining_cards: number;
  created: string;
}

export interface GameCreationWithPlayersResponse extends GameCreationResponse {
  game_type: string;
  max_players: number;
  current_players: number;
}

export interface GameInfoResponse {
  game_id: string;
  deck_name: string;
  deck_type: string;
  remaining_cards: number;
  is_empty: boolean;
  created: string;
  last_used: string;
  cards?: Card[];
}

export interface GameStateResponse {
  game_id: string;
  game_type: string;
  status: GameStatus;
  current_player?: number;
  deck_name: string;
  deck_type: string;
  remaining_cards: number;
  max_players?: number;
  current_players?: number;
  players: Player[];
  dealer: Player;
  discard_piles?: DiscardPile[];
  created?: string;
  last_used?: string;
}

export interface DeckOperationResponse {
  game_id: string;
  deck_name: string;
  deck_type: string;
  message: string;
  remaining_cards: number;
}

export interface DeckResetResponse extends DeckOperationResponse {
  num_decks: number;
}

export interface PlayerAddedResponse {
  game_id: string;
  player: Player;
  message: string;
}

export interface SingleCardResponse {
  game_id: string;
  deck_name: string;
  card: Card;
  remaining_cards: number;
}

export interface MultipleCardsResponse {
  game_id: string;
  deck_name: string;
  cards: Card[];
  cards_dealt: number;
  remaining_cards: number;
}

export interface PlayerCardResponse {
  game_id: string;
  player_id: string;
  player_name: string;
  card: Card;
  hand_size: number;
  remaining_cards: number;
  message: string;
}

export interface PlayerCardWithFaceResponse extends PlayerCardResponse {
  face_up: boolean;
}

export interface DiscardResponse {
  game_id: string;
  player_id: string;
  player_name: string;
  card: Card;
  pile_id: string;
  pile_name: string;
  pile_size: number;
  hand_size: number;
  message: string;
}

export interface BlackjackStartResponse {
  game_id: string;
  status: GameStatus;
  message: string;
  current_player: number;
}

export interface BlackjackHitResponse {
  game_id: string;
  player_id: string;
  player_name: string;
  hand_value: number;
  hand_size: number;
  has_blackjack: boolean;
  is_busted: boolean;
  message: string;
}

export interface BlackjackStandResponse {
  game_id: string;
  player_id: string;
  player_name: string;
  status: GameStatus;
  current_player?: number;
  message: string;
}

export type BlackjackResult = 'blackjack' | 'win' | 'push' | 'bust' | 'lose';

export interface BlackjackPlayerResult {
  player_id: string;
  player_name: string;
  hand_value: number;
  has_blackjack: boolean;
  is_busted: boolean;
  result: BlackjackResult;
}

export interface BlackjackResultsResponse {
  game_id: string;
  status: 'finished';
  dealer: {
    hand_value: number;
    has_blackjack: boolean;
    is_busted: boolean;
  };
  players: BlackjackPlayerResult[];
  results: Record<string, BlackjackResult>;
}

// Request interfaces
export interface AddPlayerRequest {
  name: string;
}

export interface DiscardCardRequest {
  player_id: string;
  card_index: number;
}

// Utility types
export type DeckTypeOption = 'standard' | 'spanish21';

export interface GameListResponse {
  games: string[];
  game_count: number;
}

export interface DeckTypesResponse {
  deck_types: DeckType[];
  count: number;
}

// Helper function to get card display name
export function getCardName(card: Card): string {
  const ranks = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suits = ['♥', '♦', '♣', '♠'];
  return `${ranks[card.rank]}${suits[card.suit]}`;
}

// Helper function to get suit name
export function getSuitName(suit: number): string {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  return suits[suit] || 'Unknown';
}

// Helper function to get rank name
export function getRankName(rank: number): string {
  const ranks = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  return ranks[rank] || 'Unknown';
}