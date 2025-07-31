import React, { useState, useEffect } from 'react';
import { useBlackjackGame } from '../../hooks/useBlackjackGame';
import { useBlackjackResults } from '../../hooks/useBlackjackResults';
import { GameTable } from './GameTable';
import { BettingControls } from './BettingControls';
import { BlackjackControls } from './BlackjackControls';
import { config } from '../../config/environment';

interface BlackjackGameProps {
  className?: string;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({ className = '' }) => {
  const [balance, setBalance] = useState(config.defaultPlayerBalance);
  const [currentBet, setCurrentBet] = useState(config.minBet);
  const [playerName] = useState('Player');
  const [playerId, setPlayerId] = useState<string>('');

  const blackjackGame = useBlackjackGame(playerId);
  const results = useBlackjackResults();

  // Game state derived from the hook
  const {
    gameId,
    gameState,
    isLoading,
    error,
    isGameStarted,
    isGameFinished,
    players,
    dealer,
    remainingCards,
    createNewGame,
    addPlayer,
    startGame,
    hit,
    stand,
    refreshGameState,
    leaveGame
  } = blackjackGame;

  const player = players.length > 0 ? players[0] : null;
  const canHit = Boolean(isGameStarted && !isGameFinished && player && !player.is_busted && (player.hand_value || 0) < 21);
  const canStand = Boolean(isGameStarted && !isGameFinished && player && !player.is_busted);

  // Handle creating a new game and adding the player
  const handleNewGame = async () => {
    try {
      setBalance(prev => prev - currentBet); // Deduct bet from balance
      await createNewGame(1, 'standard', 1); // Single deck, standard cards, 1 player max
    } catch (error) {
      setBalance(prev => prev + currentBet); // Refund bet on error
      console.error('Failed to create new game:', error);
    }
  };

  // Add player to the game once it's created
  useEffect(() => {
    if (gameId && !playerId && players.length === 0) {
      addPlayer(playerName).then(() => {
        // Find the newly added player
        refreshGameState().then(() => {
          if (players.length > 0) {
            setPlayerId(players[0].id);
          }
        });
      });
    }
  }, [gameId, playerId, players.length, playerName, addPlayer, refreshGameState, players]);

  // Start the blackjack game once player is added
  useEffect(() => {
    if (gameId && playerId && players.length > 0 && gameState?.status === 'waiting') {
      startGame();
    }
  }, [gameId, playerId, players.length, gameState?.status, startGame]);

  // Fetch results when game is finished
  useEffect(() => {
    if (isGameFinished && gameId) {
      results.fetchResults(gameId);
    }
  }, [isGameFinished, gameId, results]);

  // Handle game completion and betting resolution
  useEffect(() => {
    if (results.results && results.results.players.length > 0) {
      const playerResult = results.results.players[0];
      let winnings = 0;

      switch (playerResult.result) {
        case 'blackjack':
          winnings = currentBet * 2.5; // Blackjack pays 3:2
          break;
        case 'win':
          winnings = currentBet * 2; // Regular win pays 1:1
          break;
        case 'push':
          winnings = currentBet; // Push returns the bet
          break;
        default:
          winnings = 0; // Lose or bust
      }

      if (winnings > 0) {
        setBalance(prev => prev + winnings);
      }
    }
  }, [results.results, currentBet]);

  const handleHit = async () => {
    if (canHit) {
      await hit();
    }
  };

  const handleStand = async () => {
    if (canStand) {
      await stand();
    }
  };

  const handleStartNewRound = () => {
    leaveGame();
    results.clearResults();
    setPlayerId('');
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Game Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleStartNewRound}
            className="bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-4 ${className}`}>
      {/* Game Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Blackjack</h1>
        <p className="text-primary-200">Beat the dealer without going over 21!</p>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - Betting Controls */}
        <div className="lg:col-span-1">
          {!isGameStarted ? (
            <BettingControls
              balance={balance}
              currentBet={currentBet}
              minBet={config.minBet}
              maxBet={config.maxBet}
              onBetChange={setCurrentBet}
              onDeal={handleNewGame}
              disabled={isLoading || isGameStarted}
            />
          ) : (
            <BlackjackControls
              onHit={handleHit}
              onStand={handleStand}
              onNewGame={handleStartNewRound}
              canHit={canHit}
              canStand={canStand}
              isGameOver={isGameFinished}
              isLoading={isLoading}
              playerHandValue={player?.hand_value}
            />
          )}
        </div>

        {/* Center - Game Table */}
        <div className="lg:col-span-3">
          <GameTable
            dealer={dealer}
            player={player}
            hideFirstDealerCard={Boolean(isGameStarted && !isGameFinished)}
            gameStatus={gameState?.status}
            remainingCards={remainingCards}
          />
        </div>
      </div>

      {/* Game Results */}
      {results.results && (
        <div className="mt-6 text-center">
          <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">Game Results</h3>
            {results.results.players.map((playerResult) => (
              <div key={playerResult.player_id} className="text-primary-200">
                <p className="mb-2">
                  <span className="capitalize font-semibold text-white">
                    {playerResult.result}
                  </span>
                </p>
                <p className="text-sm">
                  Your Hand: {playerResult.hand_value} | 
                  Dealer Hand: {results.results!.dealer.hand_value}
                </p>
                <p className="text-sm mt-2 text-green-400">
                  Current Balance: ${balance}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="text-primary-200">
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            Processing...
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackjackGame;