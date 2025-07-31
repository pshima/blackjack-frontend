/**
 * Game Page Component
 * Main blackjack game interface with lazy-loaded components
 */

import { Suspense, lazy } from 'react';
import { useGameState, useGameActions, useGameLoading, useGameError } from '../stores/gameStore';
import { performanceMonitor, logger } from '../services/monitoring';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Lazy load game components for better performance
const GameBoard = lazy(() => 
  import('../components/game/GameBoard').then(module => {
    performanceMonitor.recordMetric({
      name: 'game_board_loaded',
      value: 1,
      unit: 'count',
    });
    return module;
  })
);

const GameControls = lazy(() => 
  import('../components/game/GameControls').then(module => {
    performanceMonitor.recordMetric({
      name: 'game_controls_loaded',
      value: 1,
      unit: 'count',
    });
    return module;
  })
);

const PlayerStats = lazy(() => 
  import('../components/game/PlayerStats').then(module => {
    performanceMonitor.recordMetric({
      name: 'player_stats_loaded',
      value: 1,
      unit: 'count',
    });
    return module;
  })
);

interface GamePageProps {
  className?: string;
}

export default function GamePage({ className = '' }: GamePageProps) {
  const gameState = useGameState();
  const isLoading = useGameLoading();
  const error = useGameError();
  const { clearError } = useGameActions();

  // Track page load performance
  const endTimer = performanceMonitor.startTimer('game_page_render');
  
  // Log game page access
  logger.info('Game page accessed', {
    gameId: gameState?.id,
    metadata: { hasActiveGame: !!gameState }
  });

  if (error) {
    return (
      <div className={`min-h-screen bg-linear-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 ${className}`}>
        <ErrorMessage
          error={error}
          retry={clearError}
          showDetails={import.meta.env.DEV}
          variant="card"
          className="max-w-md w-full shadow-lg"
        />
      </div>
    );
  }

  if (isLoading && !gameState) {
    return (
      <div className={`min-h-screen bg-linear-to-br from-primary-50 to-primary-100 flex items-center justify-center ${className}`}>
        <LoadingSpinner size="lg" message="Loading game..." />
      </div>
    );
  }

  // End performance timer on render completion
  setTimeout(endTimer, 0);

  return (
    <div className={`min-h-screen bg-linear-to-br from-primary-50 to-primary-100 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Blackjack Casino
          </h1>
          <p className="text-primary-600">
            Test your luck against the dealer
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Player Stats Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow-md p-4">
                <LoadingSpinner size="sm" message="Loading stats..." />
              </div>
            }>
              <PlayerStats />
            </Suspense>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Game Board */}
              <Suspense fallback={
                <div className="bg-green-800 rounded-lg shadow-lg p-8 min-h-96 flex items-center justify-center">
                  <LoadingSpinner size="lg" message="Setting up table..." className="text-white" />
                </div>
              }>
                <GameBoard />
              </Suspense>

              {/* Game Controls */}
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow-md p-4 flex justify-center">
                  <LoadingSpinner size="sm" message="Loading controls..." />
                </div>
              }>
                <GameControls />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}