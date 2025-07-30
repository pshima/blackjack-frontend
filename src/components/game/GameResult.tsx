import React from 'react';

interface GameResultProps {
  playerValue: number;
  dealerValue: number;
  playerHasBlackjack: boolean;
  dealerHasBlackjack: boolean;
  playerIsBusted: boolean;
  dealerIsBusted: boolean;
}

export const GameResult: React.FC<GameResultProps> = ({
  playerValue,
  dealerValue,
  playerHasBlackjack,
  dealerHasBlackjack,
  playerIsBusted,
  dealerIsBusted
}) => {
  const getResult = () => {
    if (playerIsBusted) {
      return { message: 'You Busted!', color: 'text-red-600', emoji: '💥' };
    }
    
    if (dealerIsBusted) {
      return { message: 'Dealer Busted! You Win!', color: 'text-green-600', emoji: '🎉' };
    }
    
    if (playerHasBlackjack && dealerHasBlackjack) {
      return { message: 'Both Blackjack! Push!', color: 'text-yellow-600', emoji: '🤝' };
    }
    
    if (playerHasBlackjack) {
      return { message: 'Blackjack! You Win!', color: 'text-green-600', emoji: '🎯' };
    }
    
    if (dealerHasBlackjack) {
      return { message: 'Dealer Blackjack!', color: 'text-red-600', emoji: '💔' };
    }
    
    if (playerValue > dealerValue) {
      return { message: 'You Win!', color: 'text-green-600', emoji: '🏆' };
    } else if (playerValue < dealerValue) {
      return { message: 'Dealer Wins!', color: 'text-red-600', emoji: '😞' };
    } else {
      return { message: 'Push!', color: 'text-yellow-600', emoji: '🤝' };
    }
  };

  const result = getResult();

  return (
    <div className="text-center">
      <div className={`text-3xl mb-2`}>{result.emoji}</div>
      <h3 className={`text-xl font-bold mb-2 ${result.color}`}>
        {result.message}
      </h3>
      <div className="text-sm text-gray-600">
        <p>Your Hand: {playerValue}</p>
        <p>Dealer Hand: {dealerValue}</p>
      </div>
    </div>
  );
};