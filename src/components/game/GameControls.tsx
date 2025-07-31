/**
 * GameControls Component
 * Game action buttons and betting interface
 */

import { useState, useCallback } from 'react';
import { useGameState, usePlayerState, useGameActions, useGameLoading } from '../../stores/gameStore';
import { config } from '../../config/environment';
import { logger, performanceMonitor } from '../../services/monitoring';
import { validateBetAmount, validateRateLimit } from '../../utils/validation';
import Button from '../ui/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface GameControlsProps {
  className?: string;
}

export default function GameControls({ className = '' }: GameControlsProps) {
  const gameState = useGameState();
  const playerState = usePlayerState();
  const isLoading = useGameLoading();
  const { startNewGame, hit, stand, doubleDown, split } = useGameActions();
  
  const [betAmount, setBetAmount] = useState<number>(config.minBet);

  const isGameActive = gameState?.status === 'playing';
  const canDoubleDown = gameState?.canDoubleDown ?? false;
  const canSplit = gameState?.canSplit ?? false;
  const hasBalance = (playerState?.balance ?? 0) >= betAmount;

  const handleStartGame = async () => {
    const userId = playerState?.id || 'anonymous';
    
    // Rate limiting check
    if (!validateRateLimit(userId, 'start_game', 5, 60000)) {
      logger.warn('Start game rate limit exceeded', { userId });
      return;
    }
    
    // Validate bet amount one final time
    const betValidation = validateBetAmount(betAmount);
    if (!betValidation.isValid) {
      logger.warn('Invalid bet amount at game start', {
        betAmount,
        errors: betValidation.errors,
        userId
      });
      return;
    }
    
    if (!hasBalance) {
      logger.warn('Insufficient balance for bet', {
        betAmount,
        balance: playerState?.balance,
        userId
      });
      return;
    }

    const endTimer = performanceMonitor.startTimer('start_game_action');
    const sanitizedBetAmount = betValidation.sanitized || betAmount;
    
    try {
      logger.gameEvent('game_started', {
        userId,
        metadata: { betAmount: sanitizedBetAmount }
      });
      
      await startNewGame(sanitizedBetAmount, playerState?.id);
      endTimer();
    } catch (error) {
      endTimer();
      logger.error('Failed to start game', error as Error, {
        userId,
        action: 'start_game',
        metadata: { betAmount: sanitizedBetAmount }
      });
    }
  };

  const handleGameAction = async (
    action: () => Promise<void>, 
    actionName: string
  ) => {
    const userId = playerState?.id || 'anonymous';
    
    // Rate limiting for game actions
    if (!validateRateLimit(userId, actionName, 10, 60000)) {
      logger.warn(`${actionName} rate limit exceeded`, { userId, gameId: gameState?.id });
      return;
    }
    
    const endTimer = performanceMonitor.startTimer(`${actionName}_action`);
    
    try {
      logger.gameEvent(`action_${actionName}`, {
        gameId: gameState?.id,
        userId
      });
      
      await action();
      endTimer();
    } catch (error) {
      endTimer();
      logger.error(`Failed to ${actionName}`, error as Error, {
        gameId: gameState?.id,
        userId,
        action: actionName
      });
    }
  };

  const handleBetChange = useCallback((amount: number) => {
    // Validate bet amount with comprehensive checks
    const validation = validateBetAmount(amount);
    
    if (!validation.isValid) {
      logger.warn('Invalid bet amount entered', {
        amount,
        errors: validation.errors,
        userId: playerState?.id
      });
      // Don't update if invalid, but show the errors
      return;
    }
    
    // Additional check against player balance
    const sanitizedAmount = validation.sanitized || amount;
    const maxAllowedBet = Math.min(config.maxBet, playerState?.balance ?? 0);
    const finalAmount = Math.min(sanitizedAmount, maxAllowedBet);
    
    setBetAmount(finalAmount);
  }, [playerState?.balance, playerState?.id]);

  const quickBetAmounts = [5, 10, 25, 50, 100].filter(amount => 
    amount >= config.minBet && 
    amount <= config.maxBet &&
    amount <= (playerState?.balance ?? 0)
  );

  if (isLoading && !gameState) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 text-center ${className}`}>
        <LoadingSpinner size="sm" message="Loading game..." />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {!isGameActive ? (
        /* New Game Controls */
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Place Your Bet
            </h3>
            
            {/* Bet Amount Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <label htmlFor="bet-amount" className="text-sm font-medium text-gray-700">
                  Bet Amount:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    id="bet-amount"
                    type="number"
                    min={config.minBet}
                    max={Math.min(config.maxBet, playerState?.balance ?? 0)}
                    value={betAmount}
                    onChange={(e) => handleBetChange(Number(e.target.value))}
                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-md w-24 text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Quick Bet Buttons */}
              {quickBetAmounts.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {quickBetAmounts.map(amount => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? 'primary' : 'outline-solid'}
                      size="sm"
                      onClick={() => handleBetChange(amount)}
                      disabled={isLoading}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Balance Info */}
            <div className="text-sm text-gray-600 mb-4">
              Balance: ${playerState?.balance ?? 0}
              {!hasBalance && (
                <div className="text-red-600 text-xs mt-1">
                  Insufficient balance for this bet
                </div>
              )}
            </div>

            {/* Start Game Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartGame}
              disabled={isLoading || !hasBalance}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting Game...
                </>
              ) : (
                'Deal Cards'
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Game Action Controls */
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Turn
            </h3>
            <p className="text-sm text-gray-600">
              Choose your action
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Hit Button */}
            <Button
              variant="primary"
              onClick={() => handleGameAction(hit, 'hit')}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Hit'}
            </Button>

            {/* Stand Button */}
            <Button
              variant="secondary"
              onClick={() => handleGameAction(stand, 'stand')}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Stand'}
            </Button>

            {/* Double Down Button */}
            {canDoubleDown && (
              <Button
                variant="outline"
                onClick={() => handleGameAction(doubleDown, 'double_down')}
                disabled={isLoading || (playerState?.balance ?? 0) < (gameState?.currentBet ?? 0)}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Double Down'}
              </Button>
            )}

            {/* Split Button */}
            {canSplit && (
              <Button
                variant="outline"
                onClick={() => handleGameAction(split, 'split')}
                disabled={isLoading || (playerState?.balance ?? 0) < (gameState?.currentBet ?? 0)}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Split'}
              </Button>
            )}
          </div>

          {/* Game Info */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t">
            Current Bet: ${gameState?.currentBet ?? 0}
          </div>
        </div>
      )}
    </div>
  );
}