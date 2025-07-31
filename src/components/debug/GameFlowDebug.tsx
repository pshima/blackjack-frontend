import React, { useState } from 'react';
import { cardGameApi } from '../../services/cardgame-api';
import { useBlackjackGame } from '../../hooks/useBlackjackGame';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: unknown;
  duration?: number;
}

export const GameFlowDebug: React.FC = () => {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<unknown>(null);

  // Also test with the actual hook
  const blackjackGame = useBlackjackGame();

  const addStep = (step: Omit<TestStep, 'status' | 'message'> & { status?: TestStep['status']; message?: string }) => {
    setSteps(prev => [...prev, {
      status: 'pending',
      message: 'Starting...',
      ...step
    }]);
  };

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const runStep = async (id: string, name: string, testFn: () => Promise<unknown>) => {
    const startTime = Date.now();
    updateStep(id, { status: 'running', message: 'Running...' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateStep(id, {
        status: 'success',
        message: `✅ Success (${duration}ms)`,
        data: result,
        duration
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateStep(id, {
        status: 'error',
        message: `❌ ${String(error)} (${duration}ms)`,
        data: error,
        duration
      });
      throw error;
    }
  };

  const runCompleteGameFlow = async () => {
    setIsRunning(true);
    setSteps([]);
    setGameState(null);

    try {
      // Step 1: Test basic API connection
      addStep({ id: 'api-hello', name: 'API Hello Check' });
      await runStep('api-hello', 'API Hello Check', () => 
        cardGameApi.healthCheck()
      );

      // Step 2: Create game
      addStep({ id: 'create-game', name: 'Create Game' });
      const gameResult = await runStep('create-game', 'Create Game', () =>
        cardGameApi.createGame(1, 'standard', 4)
      );

      // Step 3: Get initial game state
      addStep({ id: 'get-state-1', name: 'Get Initial Game State' });
      await runStep('get-state-1', 'Get Initial Game State', () =>
        cardGameApi.getGameState(gameResult.game_id)
      );

      // Step 4: Add player
      addStep({ id: 'add-player', name: 'Add Player' });
      await runStep('add-player', 'Add Player', () =>
        cardGameApi.addPlayer(gameResult.game_id, 'TestPlayer')
      );

      // Step 5: Get game state after player added
      addStep({ id: 'get-state-2', name: 'Get Game State (After Player)' });
      await runStep('get-state-2', 'Get Game State (After Player)', () =>
        cardGameApi.getGameState(gameResult.game_id)
      );

      // Step 6: Start blackjack game
      addStep({ id: 'start-game', name: 'Start Blackjack Game' });
      await runStep('start-game', 'Start Blackjack Game', () =>
        cardGameApi.startBlackjackGame(gameResult.game_id)
      );

      // Step 7: Get final game state
      addStep({ id: 'get-state-3', name: 'Get Game State (After Start)' });
      const finalState = await runStep('get-state-3', 'Get Game State (After Start)', () =>
        cardGameApi.getGameState(gameResult.game_id)
      );

      setGameState(finalState);

    } catch (error) {
      console.error('Game flow test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testBlackjackGameHook = async () => {
    setIsRunning(true);
    setSteps([]);

    try {
      // Test the actual hook flow
      addStep({ id: 'hook-create', name: 'BlackjackGame Hook - Create Game' });
      
      await runStep('hook-create', 'BlackjackGame Hook - Create Game', async () => {
        await blackjackGame.createNewGame(1, 'standard', 1);
        return { gameId: blackjackGame.gameId };
      });

      // Wait a bit for state updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      addStep({ id: 'hook-state', name: 'BlackjackGame Hook - Check State' });
      await runStep('hook-state', 'BlackjackGame Hook - Check State', async () => {
        return {
          gameId: blackjackGame.gameId,
          players: blackjackGame.players,
          dealer: blackjackGame.dealer,
          gameState: blackjackGame.gameState,
          isGameStarted: blackjackGame.isGameStarted,
          error: blackjackGame.error
        };
      });

    } catch (error) {
      console.error('Hook test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🎯 Game Flow Debug & Test
      </h1>

      {/* Test Controls */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">🧪 Test Controls</h2>
        
        <div className="flex gap-4">
          <button
            onClick={runCompleteGameFlow}
            disabled={isRunning}
            className={`px-6 py-3 rounded font-bold transition-all ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? '🔄 Testing...' : '🧪 Test Complete API Flow'}
          </button>
          
          <button
            onClick={testBlackjackGameHook}
            disabled={isRunning}
            className={`px-6 py-3 rounded font-bold transition-all ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? '🔄 Testing...' : '🎮 Test BlackjackGame Hook'}
          </button>
        </div>
      </div>

      {/* Hook State Display */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">🎮 Current BlackjackGame Hook State</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-primary-300">Game ID:</span>
            <div className="text-white font-mono text-xs break-all">
              {blackjackGame.gameId || 'None'}
            </div>
          </div>
          <div>
            <span className="text-primary-300">Players:</span>
            <div className="text-white">{blackjackGame.players.length}</div>
          </div>
          <div>
            <span className="text-primary-300">Is Loading:</span>
            <div className={blackjackGame.isLoading ? 'text-yellow-400' : 'text-green-400'}>
              {blackjackGame.isLoading ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <span className="text-primary-300">Error:</span>
            <div className={blackjackGame.error ? 'text-red-400' : 'text-green-400'}>
              {blackjackGame.error || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">📋 Test Results</h2>
        
        {steps.length === 0 ? (
          <div className="text-primary-300 text-center py-8">
            Click a test button above to start debugging
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="bg-primary-900 p-4 rounded-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      step.status === 'success' ? 'text-green-400' :
                      step.status === 'error' ? 'text-red-400' :
                      step.status === 'running' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {step.status === 'success' ? '✅' :
                       step.status === 'error' ? '❌' :
                       step.status === 'running' ? '🔄' :
                       '⏸️'}
                    </span>
                    <span className="text-white font-medium">{step.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${
                      step.status === 'success' ? 'text-green-400' :
                      step.status === 'error' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {step.message}
                    </div>
                  </div>
                </div>
                
                {step.data && (
                  <details className="mt-2">
                    <summary className="text-primary-300 text-sm cursor-pointer">
                      View Data
                    </summary>
                    <pre className="mt-2 text-xs bg-black p-2 rounded-sm overflow-auto text-green-400">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Game State */}
      {gameState && (
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">🎮 Final Game State</h2>
          <pre className="text-xs bg-black p-4 rounded-sm overflow-auto text-green-400">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};