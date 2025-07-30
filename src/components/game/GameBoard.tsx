/**
 * GameBoard Component
 * Main game table displaying cards and game state
 */

import { useGameState, usePlayerState } from '../../stores/gameStore';
import Card from '../ui/Card';
import { logger } from '../../services/monitoring';
import type { Card as CardType } from '../../types/blackjack';

interface GameBoardProps {
  className?: string;
}

export default function GameBoard({ className = '' }: GameBoardProps) {
  const gameState = useGameState();
  const playerState = usePlayerState();

  if (!gameState || !playerState) {
    return (
      <div className={`bg-green-800 rounded-lg shadow-lg p-8 min-h-96 flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Blackjack</h2>
          <p className="text-green-200">Start a new game to begin playing</p>
        </div>
      </div>
    );
  }

  // Log game board render
  logger.debug('GameBoard rendered', {
    gameId: gameState.id,
    gameStatus: gameState.status,
    playerBalance: playerState.balance
  });

  const renderCards = (cards: CardType[], title: string, hideFirstCard = false) => {
    if (!cards.length) return null;

    return (
      <div className="text-center">
        <h3 className="text-white text-lg font-semibold mb-3">{title}</h3>
        <div className="flex justify-center gap-2 mb-4">
          {cards.map((card, index) => (
            <Card
              key={`${card.suit}-${card.rank}-${index}`}
              card={hideFirstCard && index === 0 ? null : card}
              className="transform hover:scale-105 transition-transform"
            />
          ))}
        </div>
      </div>
    );
  };

  const calculateHandValue = (cards: CardType[]): number => {
    let value = 0;
    let aces = 0;

    for (const card of cards) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  };

  const playerValue = calculateHandValue(gameState.playerHand);
  const dealerValue = gameState.status === 'playing' 
    ? calculateHandValue(gameState.dealerHand.slice(1)) // Hide first card value
    : calculateHandValue(gameState.dealerHand);

  const getGameStatusMessage = (): string => {
    switch (gameState.status) {
      case 'won':
        return '🎉 You Win!';
      case 'lost':
        return '😞 You Lose';
      case 'push':
        return '🤝 Push (Tie)';
      case 'blackjack':
        return '🃏 Blackjack!';
      default:
        return 'Your Turn';
    }
  };

  return (
    <div className={`bg-green-800 rounded-lg shadow-lg p-8 min-h-96 ${className}`}>
      {/* Game Status */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {getGameStatusMessage()}
        </h2>
        {gameState.status === 'playing' && (
          <p className="text-green-200">
            Choose your action below
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dealer's Hand */}
        <div>
          {renderCards(
            gameState.dealerHand, 
            `Dealer (${gameState.status === 'playing' ? '?' : dealerValue})`,
            gameState.status === 'playing'
          )}
        </div>

        {/* Player's Hand */}
        <div>
          {renderCards(
            gameState.playerHand,
            `Player (${playerValue})`
          )}
          
          {/* Bust indicator */}
          {playerValue > 21 && (
            <div className="text-red-300 font-semibold text-center">
              BUST!
            </div>
          )}
          
          {/* Blackjack indicator */}
          {playerValue === 21 && gameState.playerHand.length === 2 && (
            <div className="text-yellow-300 font-semibold text-center">
              BLACKJACK!
            </div>
          )}
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-8 flex justify-between text-white text-sm">
        <div>
          <span className="text-green-200">Bet: </span>
          <span className="font-semibold">${gameState.currentBet}</span>
        </div>
        <div>
          <span className="text-green-200">Balance: </span>
          <span className="font-semibold">${playerState.balance}</span>
        </div>
      </div>
    </div>
  );
}