import React, { useState } from 'react';

interface BettingControlsProps {
  balance: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  onBetChange: (bet: number) => void;
  onDeal: () => void;
  disabled?: boolean;
}

const QUICK_BET_AMOUNTS = [5, 10, 25, 50, 100];

export const BettingControls: React.FC<BettingControlsProps> = ({
  balance,
  currentBet,
  minBet,
  maxBet,
  onBetChange,
  onDeal,
  disabled = false
}) => {
  const [customBet, setCustomBet] = useState(currentBet.toString());

  const handleCustomBetChange = (value: string) => {
    setCustomBet(value);
    const numValue = parseInt(value) || 0;
    if (numValue >= minBet && numValue <= Math.min(maxBet, balance)) {
      onBetChange(numValue);
    }
  };

  const handleQuickBet = (amount: number) => {
    const finalAmount = Math.min(amount, balance, maxBet);
    setCustomBet(finalAmount.toString());
    onBetChange(finalAmount);
  };

  const canDeal = currentBet >= minBet && currentBet <= balance && !disabled;

  return (
    <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Place Your Bet</h3>
        <div className="text-primary-200">
          Balance: <span className="text-green-400 font-semibold">${balance}</span>
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-primary-200 mb-3">
          Quick Bet
        </label>
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_BET_AMOUNTS.map((amount) => {
            const isDisabled = amount > balance || disabled;
            return (
              <button
                key={amount}
                onClick={() => handleQuickBet(amount)}
                disabled={isDisabled}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${isDisabled 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-primary-600 text-white hover:bg-primary-500 hover:scale-105 active:scale-95'
                  }
                  ${currentBet === amount ? 'ring-2 ring-yellow-400' : ''}
                `}
              >
                ${amount}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Bet Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-primary-200 mb-2">
          Custom Bet (${minBet} - ${Math.min(maxBet, balance)})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
            $
          </span>
          <input
            type="number"
            value={customBet}
            onChange={(e) => handleCustomBetChange(e.target.value)}
            min={minBet}
            max={Math.min(maxBet, balance)}
            disabled={disabled}
            className="
              w-full pl-8 pr-4 py-3 bg-primary-700 border border-primary-600 
              rounded-lg text-white placeholder-primary-300
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
              disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
            "
            placeholder="Enter bet amount"
          />
        </div>
        {currentBet > 0 && currentBet < minBet && (
          <p className="text-red-400 text-xs mt-1">
            Minimum bet is ${minBet}
          </p>
        )}
        {currentBet > balance && (
          <p className="text-red-400 text-xs mt-1">
            Insufficient balance
          </p>
        )}
      </div>

      {/* Current Bet Display */}
      {currentBet > 0 && (
        <div className="mb-6 text-center">
          <div className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            Current Bet: ${currentBet}
          </div>
        </div>
      )}

      {/* Deal Button */}
      <button
        onClick={onDeal}
        disabled={!canDeal}
        className={`
          w-full py-4 rounded-lg font-bold text-lg transition-all
          ${canDeal
            ? 'bg-green-600 text-white hover:bg-green-500 hover:scale-105 active:scale-95 shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {disabled ? 'Game in Progress' : canDeal ? 'Deal Cards' : 'Place Bet to Deal'}
      </button>

      {/* Betting Rules */}
      <div className="mt-4 text-xs text-primary-300 text-center">
        <p>Min bet: ${minBet} • Max bet: ${maxBet}</p>
        <p>Blackjack pays 3:2 • Insurance pays 2:1</p>
      </div>
    </div>
  );
};

export default BettingControls;