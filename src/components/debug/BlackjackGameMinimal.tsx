import React, { useState } from 'react';

// Minimal BlackjackGame component to test basic functionality
export const BlackjackGameMinimal: React.FC = () => {
  const [gameState, setGameState] = useState({
    balance: 1000,
    bet: 10,
    playerHand: [] as string[],
    dealerHand: [] as string[],
    gamePhase: 'betting' as 'betting' | 'playing' | 'finished'
  });

  const dealInitialCards = () => {
    setGameState(prev => ({
      ...prev,
      playerHand: ['A♠', 'K♦'],
      dealerHand: ['?', '7♣'],
      gamePhase: 'playing'
    }));
  };

  const hit = () => {
    const newCard = ['2♠', '3♥', '4♦', '5♣'][Math.floor(Math.random() * 4)];
    setGameState(prev => ({
      ...prev,
      playerHand: [...prev.playerHand, newCard]
    }));
  };

  const stand = () => {
    setGameState(prev => ({
      ...prev,
      dealerHand: ['K♠', '7♣'],
      gamePhase: 'finished'
    }));
  };

  const reset = () => {
    setGameState({
      balance: 1000,
      bet: 10,
      playerHand: [],
      dealerHand: [],
      gamePhase: 'betting'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🃏 Minimal Blackjack Game
      </h1>
      
      {/* Game Status */}
      <div className="bg-primary-800 rounded-lg p-4 mb-6 border border-primary-600">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-green-400 font-bold">${gameState.balance}</div>
            <div className="text-primary-300 text-sm">Balance</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold">${gameState.bet}</div>
            <div className="text-primary-300 text-sm">Current Bet</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold">{gameState.gamePhase}</div>
            <div className="text-primary-300 text-sm">Phase</div>
          </div>
          <div>
            <div className="text-purple-400 font-bold">v0.1</div>
            <div className="text-primary-300 text-sm">Version</div>
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="bg-primary-900 rounded-lg p-8 mb-6 border border-primary-700">
        {/* Dealer */}
        <div className="text-center mb-8">
          <h3 className="text-white text-lg font-semibold mb-3">Dealer</h3>
          <div className="flex justify-center gap-2 mb-2">
            {gameState.dealerHand.map((card, index) => (
              <div key={index} className="bg-white text-black p-3 rounded-sm border text-center font-bold min-w-[50px]">
                {card}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex-1 h-px bg-primary-600"></div>
          <div className="px-4 text-primary-300 text-sm font-medium">VS</div>
          <div className="flex-1 h-px bg-primary-600"></div>
        </div>

        {/* Player */}
        <div className="text-center">
          <h3 className="text-white text-lg font-semibold mb-3">Your Hand</h3>
          <div className="flex justify-center gap-2 mb-2">
            {gameState.playerHand.map((card, index) => (
              <div key={index} className="bg-white text-black p-3 rounded-sm border text-center font-bold min-w-[50px]">
                {card}
              </div>
            ))}
            {gameState.playerHand.length === 0 && (
              <div className="text-primary-400 italic">No cards dealt</div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
        <h3 className="text-white text-lg font-semibold mb-4 text-center">Game Controls</h3>
        
        <div className="flex justify-center gap-3">
          {gameState.gamePhase === 'betting' && (
            <button
              onClick={dealInitialCards}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-sm transition-all"
            >
              Deal Cards
            </button>
          )}
          
          {gameState.gamePhase === 'playing' && (
            <>
              <button
                onClick={hit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-sm transition-all"
              >
                🃏 Hit
              </button>
              <button
                onClick={stand}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-sm transition-all"
              >
                ✋ Stand
              </button>
            </>
          )}
          
          {gameState.gamePhase === 'finished' && (
            <button
              onClick={reset}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-sm transition-all"
            >
              🔄 New Game
            </button>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-600">
        <details>
          <summary className="text-white cursor-pointer mb-2">🔍 Debug Info</summary>
          <pre className="text-xs text-gray-300 font-mono overflow-auto">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};