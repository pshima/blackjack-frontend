/**
 * Blackjack game domain types
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
}

export interface Hand {
  cards: Card[];
  value: number;
  isBust: boolean;
  isBlackjack: boolean;
  isSoft: boolean; // Contains an ace counted as 11
}

export interface GameState {
  id: string;
  playerHand: Hand;
  dealerHand: Hand;
  deck: Card[];
  gameStatus: 'waiting' | 'playing' | 'dealer-turn' | 'finished';
  result?: 'win' | 'lose' | 'draw' | 'blackjack';
  bet: number;
  balance: number;
  canDoubleDown: boolean;
  canSplit: boolean;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
    winRate: number;
  };
}

export interface GameAction {
  type: 'hit' | 'stand' | 'double' | 'split';
  timestamp: number;
}

export interface GameHistory {
  gameId: string;
  startTime: number;
  endTime: number;
  initialBet: number;
  finalResult: GameState['result'];
  actions: GameAction[];
  finalBalance: number;
}

// API Response types
export interface StartGameRequest {
  bet: number;
  playerId?: string;
}

export interface StartGameResponse {
  game: GameState;
  player: Player;
}

export interface GameActionRequest {
  gameId: string;
  action: GameAction['type'];
}

export interface GameActionResponse {
  game: GameState;
  player: Player;
}

// Utility types
export type GameResult = NonNullable<GameState['result']>;
export type GameStatus = GameState['gameStatus'];
export type ActionType = GameAction['type'];