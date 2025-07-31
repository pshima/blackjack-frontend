import React, { useState, useEffect } from 'react';
import { useBlackjackGame } from '../../hooks/useBlackjackGame';
import { useBlackjackResults } from '../../hooks/useBlackjackResults';
import { config } from '../../config/environment';
import { cardGameApi } from '../../services/cardgame-api';
import { Hand } from './Hand';

interface CasinoBlackjackGameProps {
  className?: string;
}

export const CasinoBlackjackGame: React.FC<CasinoBlackjackGameProps> = ({ className = '' }) => {
  const [balance, setBalance] = useState(config.defaultPlayerBalance);
  const [currentBet, setCurrentBet] = useState(config.minBet);
  const [playerName] = useState('Player');
  const [playerId, setPlayerId] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<'betting' | 'creating' | 'playing' | 'finished'>('betting');

  const blackjackGame = useBlackjackGame(playerId);
  const results = useBlackjackResults();

  const {
    gameId,
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

  // Game flow handlers (same logic as original)
  const handleDealCards = async () => {
    try {
      setGamePhase('creating');
      setBalance(prev => prev - currentBet);
      await createNewGame(1, 'standard', 1);
    } catch (error) {
      console.error('❌ Deal Cards failed:', error);
      setBalance(prev => prev + currentBet);
      setGamePhase('betting');
    }
  };

  // Add player after game creation
  useEffect(() => {
    const addPlayerToGame = async () => {
      if (gameId && gamePhase === 'creating' && players && players.length === 0) {
        try {
          await addPlayer(playerName);
          await refreshGameState();
        } catch (error) {
          console.error('❌ Failed to add player:', error);
          setGamePhase('betting');
        }
      }
    };
    addPlayerToGame();
  }, [gameId, gamePhase, players, playerName, addPlayer, refreshGameState]);

  // Start game after player is added
  useEffect(() => {
    const startBlackjackGame = async () => {
      if (gameId && gamePhase === 'creating' && players && players.length > 0 && !playerId) {
        try {
          const newPlayerId = players[0].id;
          setPlayerId(newPlayerId);
          await cardGameApi.shuffleDeck(gameId);
          await startGame();
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
          winnings = currentBet * 2.5;
          break;
        case 'win':
          winnings = currentBet * 2;
          break;
        case 'push':
          winnings = currentBet;
          break;
        default:
          winnings = 0;
      }

      if (winnings > 0) {
        setBalance(prev => prev + winnings);
      }
    }
  }, [results.results, currentBet, gamePhase]);

  const handleHit = async () => {
    if (canHit) await hit();
  };

  const handleStand = async () => {
    if (canStand) await stand();
  };

  const handleStartNewRound = () => {
    leaveGame();
    results.clearResults();
    setPlayerId('');
    setGamePhase('betting');
  };

  const getBetChips = (amount: number) => {
    const chips = [];
    if (amount >= 100) chips.push({ value: 100, color: 'bg-black', count: Math.floor(amount / 100) });
    if (amount >= 25) chips.push({ value: 25, color: 'bg-green-600', count: Math.floor((amount % 100) / 25) });
    if (amount >= 5) chips.push({ value: 5, color: 'bg-red-600', count: Math.floor((amount % 25) / 5) });
    if (amount % 5 > 0) chips.push({ value: 1, color: 'bg-white', count: amount % 5 });
    return chips;
  };

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="bg-gradient-to-br from-red-900 to-red-800 text-white p-8 rounded-2xl shadow-2xl border border-red-600 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-4">Game Error</h3>
            <p className="text-red-200 mb-6">{error}</p>
            <button
              onClick={handleStartNewRound}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 ${className}`}>
      {/* Casino Table Surface */}
      <div className="relative min-h-screen">
        {/* Table Felt Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-700 to-green-800"></div>
        <div className="absolute inset-0 bg-green-700 opacity-90"></div>
        
        {/* Decorative Casino Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-yellow-600 text-8xl opacity-5 select-none rotate-12">♠</div>
          <div className="absolute top-20 right-20 text-red-600 text-8xl opacity-5 select-none -rotate-12">♥</div>
          <div className="absolute bottom-20 left-16 text-black text-8xl opacity-5 select-none rotate-45">♣</div>
          <div className="absolute bottom-10 right-12 text-red-600 text-8xl opacity-5 select-none -rotate-45">♦</div>
        </div>

        {/* Main Game Container */}
        <div className="relative z-10 p-8">
          
          {/* Balance and Status Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="bg-black bg-opacity-50 rounded-lg px-6 py-3 border border-yellow-600">
              <div className="text-yellow-400 font-bold text-lg">
                💰 Balance: <span className="text-white">${balance}</span>
              </div>
            </div>
            <div className="bg-black bg-opacity-50 rounded-lg px-6 py-3 border border-yellow-600">
              <div className="text-yellow-400 font-bold text-lg">
                🎯 Phase: <span className="text-white capitalize">{gamePhase}</span>
              </div>
            </div>
          </div>

          {/* Dealer Section */}
          <div className="text-center mb-12">
            <div className="inline-block bg-black bg-opacity-30 rounded-t-3xl px-8 py-4 border-t border-l border-r border-yellow-600">
              <h2 className="text-yellow-400 font-bold text-xl mb-2">🎩 DEALER</h2>
              {dealer && (
                <div className="text-white text-sm">
                  {!isGameFinished && isGameStarted ? 'Hidden' : `Value: ${dealer.hand_value || 0}`}
                </div>
              )}
            </div>
            
            {/* Dealer Cards */}
            <div className="bg-black bg-opacity-20 rounded-b-3xl rounded-t-none px-8 py-6 border border-yellow-600 inline-block min-w-96">
              <Hand
                cards={dealer?.hand || []}
                title=""
                handValue={isGameFinished ? dealer?.hand_value : undefined}
                isDealer={true}
                hideFirstCard={Boolean(isGameStarted && !isGameFinished)}
                className="justify-center"
              />
            </div>
          </div>

          {/* Table Center Line */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 max-w-md h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent"></div>
            <div className="mx-8 bg-yellow-600 text-black font-bold px-6 py-2 rounded-full text-sm">
              🎰 BLACKJACK TABLE 🎰
            </div>
            <div className="flex-1 max-w-md h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent"></div>
          </div>

          {/* Player Section */}
          <div className="text-center mb-8">
            {/* Player Cards */}
            <div className="bg-black bg-opacity-20 rounded-t-3xl px-8 py-6 border-t border-l border-r border-yellow-600 inline-block min-w-96">
              <Hand
                cards={player?.hand || []}
                title=""
                handValue={player?.hand_value}
                className="justify-center"
              />
            </div>
            
            <div className="inline-block bg-black bg-opacity-30 rounded-b-3xl px-8 py-4 border-b border-l border-r border-yellow-600">
              <h2 className="text-yellow-400 font-bold text-xl mb-2">👤 YOUR HAND</h2>
              <div className="text-white text-sm">
                {player ? `Value: ${player.hand_value || 0}` : 'No cards dealt'}
              </div>
            </div>
          </div>

          {/* Betting Area */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-full w-32 h-32 border-4 border-yellow-600 flex items-center justify-center shadow-2xl">
              <div className="text-center">
                <div className="text-yellow-200 text-xs font-bold">BET</div>
                <div className="text-white font-bold text-lg">${currentBet}</div>
                <div className="flex justify-center mt-1">
                  {getBetChips(currentBet).map((chip, index) => (
                    <div key={index} className="flex flex-col items-center -ml-1">
                      {Array.from({length: Math.min(chip.count, 3)}).map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full ${chip.color} border-2 border-white -mt-1 text-xs flex items-center justify-center text-white font-bold shadow-lg`}
                          style={{zIndex: 10 - i}}
                        >
                          {chip.value >= 100 ? '💯' : chip.value >= 25 ? '25' : chip.value >= 5 ? '5' : '1'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex justify-center space-x-4">
            {gamePhase === 'betting' && (
              <div className="bg-black bg-opacity-50 rounded-2xl p-6 border border-yellow-600">
                <div className="flex flex-col items-center space-y-4">
                  <h3 className="text-yellow-400 font-bold text-lg">💳 Place Your Bet</h3>
                  
                  {/* Bet Amount Controls */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentBet(Math.max(config.minBet, currentBet - 5))}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold w-10 h-10 rounded-full transition-all"
                      disabled={currentBet <= config.minBet}
                    >
                      -
                    </button>
                    <div className="text-white font-bold text-xl min-w-16 text-center">${currentBet}</div>
                    <button
                      onClick={() => setCurrentBet(Math.min(Math.min(config.maxBet, balance), currentBet + 5))}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold w-10 h-10 rounded-full transition-all"
                      disabled={currentBet >= Math.min(config.maxBet, balance)}
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Bet Buttons */}
                  <div className="flex space-x-2">
                    {[5, 25, 50, 100].filter(amount => amount <= balance).map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCurrentBet(amount)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          currentBet === amount 
                            ? 'bg-yellow-600 text-black' 
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Deal Button */}
                  <button
                    onClick={handleDealCards}
                    disabled={isLoading || currentBet > balance}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🃏 DEAL CARDS
                  </button>
                </div>
              </div>
            )}

            {gamePhase === 'creating' && (
              <div className="bg-black bg-opacity-50 rounded-2xl p-8 border border-yellow-600 text-center">
                <div className="text-yellow-400 text-4xl mb-4">🎰</div>
                <h3 className="text-white font-bold text-lg mb-2">Setting up your table...</h3>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
              </div>
            )}

            {gamePhase === 'playing' && (
              <div className="bg-black bg-opacity-50 rounded-2xl p-6 border border-yellow-600">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleHit}
                    disabled={!canHit || isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                  >
                    🃏 HIT
                  </button>
                  <button
                    onClick={handleStand}
                    disabled={!canStand || isLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                  >
                    ✋ STAND
                  </button>
                </div>
                {player && (
                  <div className="text-center mt-4 text-white">
                    <div className="text-sm">Your hand value: <span className="font-bold">{player.hand_value}</span></div>
                    {player.is_busted && <div className="text-red-400 font-bold">BUST!</div>}
                  </div>
                )}
              </div>
            )}

            {gamePhase === 'finished' && (
              <div className="bg-black bg-opacity-50 rounded-2xl p-6 border border-yellow-600 text-center">
                <h3 className="text-yellow-400 font-bold text-xl mb-4">🏁 Game Complete</h3>
                
                {/* Game Results */}
                {results.results && results.results.players && results.results.players.length > 0 && (
                  <div className="mb-6">
                    {results.results.players.map((playerResult) => (
                      <div key={playerResult.player_id} className="text-center">
                        <div className={`text-2xl font-bold mb-2 ${
                          playerResult.result === 'win' || playerResult.result === 'blackjack' ? 'text-green-400' :
                          playerResult.result === 'push' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {playerResult.result === 'blackjack' ? '🎯 BLACKJACK!' : 
                           playerResult.result === 'win' ? '🏆 YOU WIN!' :
                           playerResult.result === 'push' ? '🤝 PUSH' :
                           '💔 YOU LOSE'}
                        </div>
                        <div className="text-white text-sm mb-2">
                          Your Hand: {playerResult.hand_value} | Dealer: {results.results!.dealer.hand_value}
                        </div>
                        <div className="text-green-400 font-bold">
                          Balance: ${balance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleStartNewRound}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg"
                >
                  🔄 NEW ROUND
                </button>
              </div>
            )}
          </div>

          {/* Game Info */}
          {gameId && (
            <div className="text-center mt-8">
              <div className="inline-block bg-black bg-opacity-30 rounded-lg px-4 py-2 border border-yellow-600">
                <div className="text-yellow-400 text-xs">
                  Game ID: {gameId.slice(-8)} | Cards Left: {remainingCards || 'Unknown'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};