import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { useBlackjackGame } from '../../hooks/useBlackjackGame';
import { BlackjackGame } from '../game/BlackjackGame';

export const BlackjackGameStateMonitor: React.FC = () => {
  const [showGame, setShowGame] = useState(false);
  const [stateHistory, setStateHistory] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);

  // Monitor the hook directly
  const blackjackGame = useBlackjackGame();

  // Track state changes
  useEffect(() => {
    if (monitoring) {
      const currentState = {
        timestamp: new Date().toLocaleTimeString(),
        gameId: blackjackGame.gameId,
        players: blackjackGame.players,
        dealer: blackjackGame.dealer,
        gameState: blackjackGame.gameState,
        isGameStarted: blackjackGame.isGameStarted,
        isGameFinished: blackjackGame.isGameFinished,
        isLoading: blackjackGame.isLoading,
        error: blackjackGame.error,
        remainingCards: blackjackGame.remainingCards
      };

      setStateHistory(prev => {
        const newHistory = [...prev, currentState];
        // Keep only last 10 states
        return newHistory.slice(-10);
      });
    }
  }, [
    monitoring,
    blackjackGame.gameId,
    blackjackGame.players,
    blackjackGame.dealer,
    blackjackGame.gameState,
    blackjackGame.isGameStarted,
    blackjackGame.isGameFinished,
    blackjackGame.isLoading,
    blackjackGame.error,
    blackjackGame.remainingCards
  ]);

  const startMonitoring = () => {
    setMonitoring(true);
    setStateHistory([]);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
  };

  const clearHistory = () => {
    setStateHistory([]);
  };

  const testCreateGame = async () => {
    try {
      console.log('🎯 Manually triggering createNewGame...');
      await blackjackGame.createNewGame(1, 'standard', 1);
      console.log('✅ createNewGame completed');
    } catch (error) {
      console.error('❌ createNewGame failed:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🔍 BlackjackGame State Monitor
      </h1>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Monitoring Controls */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">📊 State Monitoring</h2>
          
          <div className="flex gap-3 mb-4">
            <button
              onClick={startMonitoring}
              disabled={monitoring}
              className={`px-4 py-2 rounded transition-all ${
                monitoring 
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {monitoring ? '🟢 Monitoring...' : '▶️ Start Monitoring'}
            </button>
            
            <button
              onClick={stopMonitoring}
              disabled={!monitoring}
              className={`px-4 py-2 rounded transition-all ${
                !monitoring 
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              ⏹️ Stop
            </button>
            
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-all"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="text-sm text-primary-300">
            <p>States tracked: {stateHistory.length}</p>
            <p>Status: {monitoring ? '🟢 Active' : '⏸️ Stopped'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">🧪 Manual Tests</h2>
          
          <div className="space-y-3">
            <button
              onClick={testCreateGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all"
            >
              🎮 Trigger createNewGame()
            </button>
            
            <button
              onClick={() => setShowGame(!showGame)}
              className={`w-full px-4 py-2 rounded transition-all ${
                showGame 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {showGame ? '❌ Hide BlackjackGame' : '👁️ Show BlackjackGame'}
            </button>
          </div>
        </div>
      </div>

      {/* Current State */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">📄 Current Hook State</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-primary-300">Game ID:</span>
            <div className="text-white font-mono text-xs break-all">
              {blackjackGame.gameId || 'null'}
            </div>
          </div>
          <div>
            <span className="text-primary-300">Players:</span>
            <div className="text-white">{blackjackGame.players.length}</div>
          </div>
          <div>
            <span className="text-primary-300">Is Started:</span>
            <div className={blackjackGame.isGameStarted ? 'text-green-400' : 'text-red-400'}>
              {blackjackGame.isGameStarted ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <span className="text-primary-300">Is Loading:</span>
            <div className={blackjackGame.isLoading ? 'text-yellow-400' : 'text-green-400'}>
              {blackjackGame.isLoading ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <details>
          <summary className="text-primary-300 cursor-pointer mb-2">View Full State</summary>
          <pre className="text-xs bg-black p-3 rounded overflow-auto text-green-400">
            {JSON.stringify({
              gameId: blackjackGame.gameId,
              players: blackjackGame.players,
              dealer: blackjackGame.dealer,
              gameState: blackjackGame.gameState,
              isGameStarted: blackjackGame.isGameStarted,
              isGameFinished: blackjackGame.isGameFinished,
              isLoading: blackjackGame.isLoading,
              error: blackjackGame.error,
              remainingCards: blackjackGame.remainingCards
            }, null, 2)}
          </pre>
        </details>
      </div>

      {/* BlackjackGame Component */}
      {showGame && (
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">🎮 Live BlackjackGame Component</h2>
          <ErrorBoundary componentName="BlackjackGame Live Test">
            <div className="bg-primary-900 p-4 rounded border">
              <BlackjackGame />
            </div>
          </ErrorBoundary>
        </div>
      )}

      {/* State History */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
        <h2 className="text-xl font-semibold text-white mb-4">📚 State Change History</h2>
        
        {stateHistory.length === 0 ? (
          <div className="text-primary-300 text-center py-8">
            Start monitoring to see state changes
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stateHistory.map((state, index) => (
              <div key={index} className="bg-primary-900 p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 text-sm font-mono">
                    #{index + 1} - {state.timestamp}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <span className={state.gameId ? 'text-green-400' : 'text-red-400'}>
                      GameID: {state.gameId ? '✅' : '❌'}
                    </span>
                    <span className={state.players.length > 0 ? 'text-green-400' : 'text-red-400'}>
                      Players: {state.players.length}
                    </span>
                    <span className={state.isGameStarted ? 'text-green-400' : 'text-red-400'}>
                      Started: {state.isGameStarted ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
                
                <details>
                  <summary className="text-primary-300 text-sm cursor-pointer">
                    View State Data
                  </summary>
                  <pre className="mt-2 text-xs bg-black p-2 rounded overflow-auto text-green-400">
                    {JSON.stringify(state, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};