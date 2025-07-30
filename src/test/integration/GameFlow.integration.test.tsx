import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { useGameStore } from '../../stores/gameStore';
import { createMockGameState, createMockPlayer, createMockStartGameResponse } from '../utils/test-utils';
import { ApiError } from '../../services/api';

// Mock the API service
const mockApiService = {
  startGame: vi.fn(),
  hit: vi.fn(),
  stand: vi.fn(),
  doubleDown: vi.fn(),
  split: vi.fn(),
};

vi.mock('../../services/api', () => ({
  apiService: mockApiService,
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Test component that uses the game store
const GameTestComponent: React.FC = () => {
  const {
    currentGame,
    currentPlayer,
    isLoading,
    error,
    startNewGame,
    hit,
    stand,
    doubleDown,
    split,
    resetGame,
    clearError,
  } = useGameStore();

  return (
    <div data-testid="game-component">
      {/* Game State Display */}
      <div data-testid="game-state">
        {currentGame ? (
          <div>
            <span data-testid="game-id">Game ID: {currentGame.id}</span>
            <span data-testid="game-status">Status: {currentGame.gameStatus}</span>
            <span data-testid="player-hand-value">Player Hand: {currentGame.playerHand.value}</span>
            <span data-testid="dealer-hand-value">Dealer Hand: {currentGame.dealerHand.value}</span>
            <span data-testid="can-double-down">Can Double Down: {currentGame.canDoubleDown.toString()}</span>
            <span data-testid="can-split">Can Split: {currentGame.canSplit.toString()}</span>
          </div>
        ) : (
          <span data-testid="no-game">No active game</span>
        )}
      </div>

      {/* Player State Display */}
      <div data-testid="player-state">
        {currentPlayer ? (
          <div>
            <span data-testid="player-name">Player: {currentPlayer.name}</span>
            <span data-testid="player-balance">Balance: ${currentPlayer.balance}</span>
          </div>
        ) : (
          <span data-testid="no-player">No player loaded</span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <div data-testid="loading">Loading...</div>}

      {/* Error State */}
      {error && (
        <div data-testid="error-display">
          <span data-testid="error-message">{error.message}</span>
          <button onClick={clearError} data-testid="clear-error">Clear Error</button>
        </div>
      )}

      {/* Game Actions */}
      <div data-testid="game-actions">
        <button
          onClick={() => startNewGame(50, 'test-player')}
          data-testid="start-game"
          disabled={isLoading}
        >
          Start Game ($50)
        </button>
        
        <button
          onClick={hit}
          data-testid="hit"
          disabled={!currentGame || isLoading}
        >
          Hit
        </button>
        
        <button
          onClick={stand}
          data-testid="stand"
          disabled={!currentGame || isLoading}
        >
          Stand
        </button>
        
        <button
          onClick={doubleDown}
          data-testid="double-down"
          disabled={!currentGame || !currentGame.canDoubleDown || isLoading}
        >
          Double Down
        </button>
        
        <button
          onClick={split}
          data-testid="split"
          disabled={!currentGame || !currentGame.canSplit || isLoading}
        >
          Split
        </button>
        
        <button
          onClick={resetGame}
          data-testid="reset-game"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

describe('Game Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Starting a new game', () => {
    it('should successfully start a new game', async () => {
      const mockResponse = createMockStartGameResponse({
        game: createMockGameState({
          id: 'integration-test-game',
          gameStatus: 'playing',
          bet: 50,
        }),
        player: createMockPlayer({
          name: 'Integration Test Player',
          balance: 950,
        }),
      });

      mockApiService.startGame.mockResolvedValue(mockResponse);

      render(<GameTestComponent />);

      // Initially no game should be active
      expect(screen.getByTestId('no-game')).toBeInTheDocument();
      expect(screen.getByTestId('no-player')).toBeInTheDocument();

      // Start a new game
      const startButton = screen.getByTestId('start-game');
      fireEvent.click(startButton);

      // Should show loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(startButton).toBeDisabled();

      // Wait for game to start
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Game state should be updated
      expect(screen.getByTestId('game-id')).toHaveTextContent('Game ID: integration-test-game');
      expect(screen.getByTestId('game-status')).toHaveTextContent('Status: playing');
      expect(screen.getByTestId('player-name')).toHaveTextContent('Player: Integration Test Player');
      expect(screen.getByTestId('player-balance')).toHaveTextContent('Balance: $950');

      // Game action buttons should be enabled
      expect(screen.getByTestId('hit')).not.toBeDisabled();
      expect(screen.getByTestId('stand')).not.toBeDisabled();
    });

    it('should handle game start errors', async () => {
      const mockError = new ApiError(400, 'Insufficient funds');
      mockApiService.startGame.mockRejectedValue(mockError);

      render(<GameTestComponent />);

      const startButton = screen.getByTestId('start-game');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should show error
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient funds');

      // Game should not be started
      expect(screen.getByTestId('no-game')).toBeInTheDocument();
    });
  });

  describe('Game actions flow', () => {
    beforeEach(async () => {
      // Set up a game in progress
      const mockResponse = createMockStartGameResponse();
      mockApiService.startGame.mockResolvedValue(mockResponse);

      render(<GameTestComponent />);
      fireEvent.click(screen.getByTestId('start-game'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });

    it('should handle hit action successfully', async () => {
      const mockHitResponse = {
        game: createMockGameState({
          playerHand: { cards: [], value: 18, isBust: false, isBlackjack: false, isSoft: false },
          gameStatus: 'playing' as const,
        }),
        player: createMockPlayer(),
      };

      mockApiService.hit.mockResolvedValue(mockHitResponse);

      fireEvent.click(screen.getByTestId('hit'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('player-hand-value')).toHaveTextContent('Player Hand: 18');
      expect(mockApiService.hit).toHaveBeenCalledWith('test-game-id');
    });

    it('should handle stand action successfully', async () => {
      const mockStandResponse = {
        game: createMockGameState({
          gameStatus: 'finished' as const,
          result: 'win' as const,
        }),
        player: createMockPlayer({ balance: 1050 }),
      };

      mockApiService.stand.mockResolvedValue(mockStandResponse);

      fireEvent.click(screen.getByTestId('stand'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('game-status')).toHaveTextContent('Status: finished');
      expect(screen.getByTestId('player-balance')).toHaveTextContent('Balance: $1050');
    });

    it('should handle double down when allowed', async () => {
      // Update store to allow double down
      useGameStore.setState({
        currentGame: createMockGameState({ canDoubleDown: true }),
      });

      const mockDoubleResponse = {
        game: createMockGameState({
          canDoubleDown: false,
          bet: 100, // Doubled bet
        }),
        player: createMockPlayer({ balance: 900 }),
      };

      mockApiService.doubleDown.mockResolvedValue(mockDoubleResponse);

      render(<GameTestComponent />);

      // Wait for component to render with updated state
      await waitFor(() => {
        expect(screen.getByTestId('can-double-down')).toHaveTextContent('Can Double Down: true');
      });

      const doubleDownButton = screen.getByTestId('double-down');
      expect(doubleDownButton).not.toBeDisabled();

      fireEvent.click(doubleDownButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockApiService.doubleDown).toHaveBeenCalledWith('test-game-id');
    });

    it('should handle split when allowed', async () => {
      // Update store to allow split
      useGameStore.setState({
        currentGame: createMockGameState({ canSplit: true }),
      });

      const mockSplitResponse = {
        game: createMockGameState({
          canSplit: false,
        }),
        player: createMockPlayer(),
      };

      mockApiService.split.mockResolvedValue(mockSplitResponse);

      render(<GameTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('can-split')).toHaveTextContent('Can Split: true');
      });

      const splitButton = screen.getByTestId('split');
      expect(splitButton).not.toBeDisabled();

      fireEvent.click(splitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockApiService.split).toHaveBeenCalledWith('test-game-id');
    });
  });

  describe('Error handling throughout game flow', () => {
    it('should handle API errors during game actions', async () => {
      // Start a game first
      const mockResponse = createMockStartGameResponse();
      mockApiService.startGame.mockResolvedValue(mockResponse);

      render(<GameTestComponent />);
      fireEvent.click(screen.getByTestId('start-game'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Mock hit error
      const mockError = new ApiError(500, 'Server error during hit');
      mockApiService.hit.mockRejectedValue(mockError);

      fireEvent.click(screen.getByTestId('hit'));

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Server error during hit');

      // Clear the error
      fireEvent.click(screen.getByTestId('clear-error'));
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });

    it('should prevent actions when no game is active', () => {
      render(<GameTestComponent />);

      // Game action buttons should be disabled when no game
      expect(screen.getByTestId('hit')).toBeDisabled();
      expect(screen.getByTestId('stand')).toBeDisabled();
      expect(screen.getByTestId('double-down')).toBeDisabled();
      expect(screen.getByTestId('split')).toBeDisabled();
    });

    it('should disable actions during loading states', async () => {
      // Start a game and keep it in loading state
      let resolveStartGame: (value: any) => void;
      const startGamePromise = new Promise(resolve => {
        resolveStartGame = resolve;
      });
      mockApiService.startGame.mockReturnValue(startGamePromise);

      render(<GameTestComponent />);
      fireEvent.click(screen.getByTestId('start-game'));

      // All buttons should be disabled during loading
      expect(screen.getByTestId('start-game')).toBeDisabled();
      expect(screen.getByTestId('hit')).toBeDisabled();
      expect(screen.getByTestId('stand')).toBeDisabled();
      expect(screen.getByTestId('double-down')).toBeDisabled();
      expect(screen.getByTestId('split')).toBeDisabled();

      // Resolve the promise
      resolveStartGame!(createMockStartGameResponse());

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Relevant buttons should be enabled after loading
      expect(screen.getByTestId('hit')).not.toBeDisabled();
      expect(screen.getByTestId('stand')).not.toBeDisabled();
    });
  });

  describe('Game state management', () => {
    it('should reset game state correctly', async () => {
      // Start a game first
      const mockResponse = createMockStartGameResponse();
      mockApiService.startGame.mockResolvedValue(mockResponse);

      render(<GameTestComponent />);
      fireEvent.click(screen.getByTestId('start-game'));

      await waitFor(() => {
        expect(screen.queryByTestId('no-game')).not.toBeInTheDocument();
      });

      // Reset the game
      fireEvent.click(screen.getByTestId('reset-game'));

      // Game state should be reset
      expect(screen.getByTestId('no-game')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();

      // Action buttons should be disabled
      expect(screen.getByTestId('hit')).toBeDisabled();
      expect(screen.getByTestId('stand')).toBeDisabled();
    });

    it('should maintain consistent state across multiple actions', async () => {
      // Start a game
      const mockStartResponse = createMockStartGameResponse({
        game: createMockGameState({ id: 'consistency-test' }),
      });
      mockApiService.startGame.mockResolvedValue(mockStartResponse);

      render(<GameTestComponent />);
      fireEvent.click(screen.getByTestId('start-game'));

      await waitFor(() => {
        expect(screen.getByTestId('game-id')).toHaveTextContent('Game ID: consistency-test');
      });

      // Perform hit action
      const mockHitResponse = {
        game: createMockGameState({
          id: 'consistency-test',
          playerHand: { cards: [], value: 15, isBust: false, isBlackjack: false, isSoft: false },
        }),
        player: createMockPlayer(),
      };
      mockApiService.hit.mockResolvedValue(mockHitResponse);

      fireEvent.click(screen.getByTestId('hit'));

      await waitFor(() => {
        expect(screen.getByTestId('player-hand-value')).toHaveTextContent('Player Hand: 15');
      });

      // Game ID should remain consistent
      expect(screen.getByTestId('game-id')).toHaveTextContent('Game ID: consistency-test');
    });
  });
});