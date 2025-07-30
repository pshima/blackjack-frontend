import React, { useState, useEffect } from 'react';
import { useBlackjackGame } from '../../hooks/useBlackjackGame';
import { useBlackjackResults } from '../../hooks/useBlackjackResults';
import { GameTable } from './GameTable';
import { BettingControls } from './BettingControls';
import { BlackjackControls } from './BlackjackControls';
import { config } from '../../config/environment';
import { cardGameApi } from '../../services/cardgame-api';

interface BlackjackGameFixedProps {
  className?: string;
}

export const BlackjackGameFixed: React.FC<BlackjackGameFixedProps> = ({ className = '' }) => {
  const [balance, setBalance] = useState(config.defaultPlayerBalance);
  const [currentBet, setCurrentBet] = useState(config.minBet);
  const [playerName] = useState('Player');
  const [playerId, setPlayerId] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<'betting' | 'creating' | 'playing' | 'finished'>('betting');

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

  const player = players && players.length > 0 ? players[0] : null;
  const canHit = Boolean(isGameStarted && !isGameFinished && player && !player.is_busted && (player.hand_value || 0) < 21);
  const canStand = Boolean(isGameStarted && !isGameFinished && player && !player.is_busted);

  // Simple, clear game flow
  const handleDealCards = async () => {
    try {
      console.log('🎯 Starting Deal Cards flow...');
      setGamePhase('creating');
      setBalance(prev => prev - currentBet); // Deduct bet from balance

      // Step 1: Create game
      console.log('Step 1: Creating game...');
      await createNewGame(1, 'standard', 1);
      
      // Step 2: Wait for game ID and add player
      console.log('Step 2: Game created, adding player...');
      // The gameId should be available after createNewGame
      
    } catch (error) {
      console.error('❌ Deal Cards failed:', error);
      setBalance(prev => prev + currentBet); // Refund bet on error
      setGamePhase('betting');
    }
  };

  // Handle adding player after game is created
  useEffect(() => {
    const addPlayerToGame = async () => {
      if (gameId && gamePhase === 'creating' && players && players.length === 0) {
        try {
          console.log('Step 3: Adding player to game...');
          await addPlayer(playerName);
          
          // Refresh to get updated player list
          await refreshGameState();
        } catch (error) {
          console.error('❌ Failed to add player:', error);
          setGamePhase('betting');
        }
      }
    };

    addPlayerToGame();
  }, [gameId, gamePhase, players, playerName, addPlayer, refreshGameState]);

  // Handle starting game after player is added
  useEffect(() => {
    const startBlackjackGame = async () => {
      if (gameId && gamePhase === 'creating' && players && players.length > 0 && !playerId) {
        try {
          console.log('Step 4: Setting player ID...');
          const newPlayerId = players[0].id;
          setPlayerId(newPlayerId);
          
          // Step 5: Shuffle the deck BEFORE dealing cards
          console.log('Step 5: Shuffling deck before dealing cards...');
          await cardGameApi.shuffleDeck(gameId);
          console.log('✅ Deck shuffled successfully!');
          
          // Step 6: Start the blackjack game (this deals the initial cards)
          console.log('Step 6: Starting game and dealing initial cards...');
          await startGame();
          
          console.log('✅ Game started successfully!');
          setGamePhase('playing');
        } catch (error) {
          console.error('❌ Failed to start game:', error);
          setGamePhase('betting');
        }
      }
    };

    startBlackjackGame();
  }, [gameId, gamePhase, players, playerId, startGame]);

  // Handle game completion
  useEffect(() => {
    if (isGameFinished && gamePhase === 'playing') {
      console.log('🏁 Game finished, fetching results...');
      setGamePhase('finished');
      if (gameId) {
        results.fetchResults(gameId);
      }
    }
  }, [isGameFinished, gamePhase, gameId, results]);

  // Handle betting resolution
  useEffect(() => {
    if (results.results && results.results.players && results.results.players.length > 0 && gamePhase === 'finished') {
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
      
      console.log(`💰 Game result: ${playerResult.result}, winnings: $${winnings}`);
    }
  }, [results.results, currentBet, gamePhase]);

  const handleHit = async () => {
    if (canHit) {
      console.log('🃏 Player hits...');
      await hit();
    }
  };

  const handleStand = async () => {
    if (canStand) {
      console.log('✋ Player stands...');
      await stand();
    }
  };

  const handleStartNewRound = () => {
    console.log('🔄 Starting new round...');
    leaveGame();
    results.clearResults();
    setPlayerId('');
    setGamePhase('betting');
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Game Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleStartNewRound}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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
        <h1 className="text-4xl font-bold text-white mb-2">🃏 Blackjack (Fixed + Shuffle)</h1>
        <p className="text-primary-200">Beat the dealer without going over 21! Deck shuffled before dealing cards.</p>
        <div className="text-sm text-primary-300 mt-2">
          Phase: <span className="font-mono text-yellow-400">{gamePhase}</span> | 
          Balance: <span className="text-green-400">${balance}</span> | 
          Players: <span className="text-blue-400">{players ? players.length : 0}</span>
          {gameId && <span> | Game: <span className="font-mono text-xs">{gameId.slice(-8)}</span></span>}
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-1">
          {gamePhase === 'betting' ? (
            <BettingControls
              balance={balance}
              currentBet={currentBet}
              minBet={config.minBet}
              maxBet={config.maxBet}
              onBetChange={setCurrentBet}
              onDeal={handleDealCards}
              disabled={isLoading || gamePhase !== 'betting'}
            />
          ) : gamePhase === 'creating' ? (
            <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 text-center">
              <div className="text-yellow-400 mb-2">🔄</div>
              <h3 className="text-white font-semibold mb-2">Creating Game...</h3>
              <p className="text-primary-300 text-sm">Setting up your blackjack table</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto"></div>
              </div>
            </div>
          ) : gamePhase === 'playing' ? (
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
          ) : (
            <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 text-center">
              <h3 className="text-white font-semibold mb-4">🏁 Game Complete</h3>
              <button
                onClick={handleStartNewRound}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition-all"
              >
                🔄 New Round
              </button>
            </div>
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
      {results.results && gamePhase === 'finished' && (
        <div className="mt-6 text-center">
          <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">🏆 Game Results</h3>
            {results.results.players && results.results.players.map((playerResult) => (
              <div key={playerResult.player_id} className="text-primary-200">
                <p className="mb-2">
                  <span className={`capitalize font-semibold ${
                    playerResult.result === 'win' || playerResult.result === 'blackjack' ? 'text-green-400' :
                    playerResult.result === 'push' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {playerResult.result === 'blackjack' ? '🎯 Blackjack!' : 
                     playerResult.result === 'win' ? '✅ You Win!' :
                     playerResult.result === 'push' ? '🤝 Push' :
                     '❌ You Lose'}
                  </span>
                </p>
                <p className="text-sm">
                  Your Hand: {playerResult.hand_value} | 
                  Dealer Hand: {results.results!.dealer.hand_value}
                </p>
                <p className="text-sm mt-2 text-green-400">
                  New Balance: ${balance}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-600">
        <details>
          <summary className="text-primary-300 cursor-pointer text-sm">🔍 Debug Info</summary>
          <div className="mt-2 text-xs font-mono text-primary-400">
            <div>Game Phase: {gamePhase}</div>
            <div>Game ID: {gameId || 'null'}</div>
            <div>Player ID: {playerId || 'null'}</div>
            <div>Is Game Started: {isGameStarted ? 'Yes' : 'No'}</div>
            <div>Is Game Finished: {isGameFinished ? 'Yes' : 'No'}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Players Count: {players ? players.length : 0}</div>
            <div>Game Status: {gameState?.status || 'null'}</div>
            <div>Hide First Dealer Card: {isGameStarted && !isGameFinished ? 'Yes' : 'No'}</div>
            {dealer && dealer.hand && dealer.hand.length > 0 && (
              <div className="mt-2 border-t border-gray-600 pt-2">
                <div>Dealer Cards ({dealer.hand.length}):</div>
                {dealer.hand.map((card, index) => (
                  <div key={index} className="ml-2">
                    Card {index}: {card.rank} of {card.suit}, face_up: {card.face_up ? 'true' : 'false'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default BlackjackGameFixed;