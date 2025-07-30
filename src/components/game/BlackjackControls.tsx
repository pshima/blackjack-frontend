import React from 'react';

interface BlackjackControlsProps {
  onHit: () => void;
  onStand: () => void;
  onNewGame: () => void;
  canHit: boolean;
  canStand: boolean;
  isGameOver: boolean;
  isLoading: boolean;
  playerHandValue?: number;
}

export const BlackjackControls: React.FC<BlackjackControlsProps> = ({
  onHit,
  onStand,
  onNewGame,
  canHit,
  canStand,
  isGameOver,
  isLoading,
  playerHandValue
}) => {
  const isBusted = playerHandValue !== undefined && playerHandValue > 21;
  const hasBlackjack = playerHandValue === 21;

  if (isGameOver) {
    return (
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 text-center">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">Game Over</h3>
          {isBusted && (
            <p className="text-red-400 text-lg font-semibold">You Busted!</p>
          )}
          {hasBlackjack && (
            <p className="text-yellow-400 text-lg font-semibold">Blackjack!</p>
          )}
        </div>
        
        <button
          onClick={onNewGame}
          disabled={isLoading}
          className="
            w-full py-4 rounded-lg font-bold text-lg transition-all
            bg-green-600 text-white hover:bg-green-500 hover:scale-105 active:scale-95 
            disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
            shadow-lg
          "
        >
          {isLoading ? 'Starting New Game...' : 'New Game'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Your Turn</h3>
        <p className="text-primary-200 text-sm">
          Choose your action
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Hit Button */}
        <button
          onClick={onHit}
          disabled={!canHit || isLoading}
          className={`
            py-4 px-6 rounded-lg font-bold text-lg transition-all
            ${canHit && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? '...' : 'Hit'}
        </button>

        {/* Stand Button */}
        <button
          onClick={onStand}
          disabled={!canStand || isLoading}
          className={`
            py-4 px-6 rounded-lg font-bold text-lg transition-all
            ${canStand && !isLoading
              ? 'bg-red-600 text-white hover:bg-red-500 hover:scale-105 active:scale-95 shadow-lg'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? '...' : 'Stand'}
        </button>
      </div>

      {/* Action Hints */}
      <div className="mt-4 text-xs text-primary-300 text-center space-y-1">
        <p><strong>Hit:</strong> Take another card</p>
        <p><strong>Stand:</strong> Keep your current hand</p>
        {playerHandValue && (
          <p className="text-yellow-300">
            Current hand value: <strong>{playerHandValue}</strong>
          </p>
        )}
      </div>

      {/* Strategy Hints */}
      {playerHandValue && playerHandValue < 21 && (
        <div className="mt-4 p-3 bg-primary-700 rounded border border-primary-600">
          <p className="text-xs text-primary-200 text-center">
            💡 {getStrategyHint(playerHandValue)}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to provide basic strategy hints
function getStrategyHint(handValue: number): string {
  if (handValue <= 11) {
    return "Always hit with 11 or less - you can't bust!";
  } else if (handValue === 12) {
    return "Consider the dealer's up card before deciding";
  } else if (handValue >= 13 && handValue <= 16) {
    return "This is a tough spot - watch the dealer's up card";
  } else if (handValue >= 17 && handValue <= 20) {
    return "Strong hand - consider standing";
  } else {
    return "Good luck!";
  }
}

export default BlackjackControls;