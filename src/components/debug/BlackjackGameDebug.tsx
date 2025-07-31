import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { BlackjackGameMinimal } from './BlackjackGameMinimal';
import TestActualImports from './TestComponentImports';
import { BlackjackGame } from '../game/BlackjackGame';
import { GameFlowDebug } from './GameFlowDebug';
import { BlackjackGameStateMonitor } from './BlackjackGameStateMonitor';

// Test each BlackjackGame dependency individually

const TestHooks: React.FC = () => {
  const [hookResults, setHookResults] = useState<string[]>([]);
  
  const testImport = async (name: string, testFn: () => Promise<void>) => {
    try {
      await testFn();
      setHookResults(prev => [...prev, `✅ ${name}: Import successful`]);
    } catch (error) {
      setHookResults(prev => [...prev, `❌ ${name}: ${error}`]);
    }
  };

  const runTests = async () => {
    setHookResults(['🔄 Testing imports...']);
    
    // Test hook imports
    await testImport('useBlackjackGame hook', async () => {
      const module = await import('../../hooks/useBlackjackGame');
      if (!module.useBlackjackGame) throw new Error('Hook not exported');
    });
    
    await testImport('useBlackjackResults hook', async () => {
      const module = await import('../../hooks/useBlackjackResults');
      if (!module.useBlackjackResults) throw new Error('Hook not exported');
    });
    
    // Test component imports
    await testImport('GameTable component', async () => {
      const module = await import('../game/GameTable');
      if (!module.GameTable) throw new Error('Component not exported');
    });
    
    await testImport('BettingControls component', async () => {
      const module = await import('../game/BettingControls');
      if (!module.BettingControls) throw new Error('Component not exported');
    });
    
    await testImport('BlackjackControls component', async () => {
      const module = await import('../game/BlackjackControls');
      if (!module.BlackjackControls) throw new Error('Component not exported');
    });
    
    // Test config import
    await testImport('environment config', async () => {
      const module = await import('../../config/environment');
      if (!module.config) throw new Error('Config not exported');
    });
  };

  return (
    <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
      <h2 className="text-xl font-semibold text-white mb-4">🧪 BlackjackGame Dependencies Test</h2>
      
      <button
        onClick={runTests}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm mb-4"
      >
        Test All Dependencies
      </button>
      
      <div className="space-y-2">
        {hookResults.length === 0 ? (
          <p className="text-primary-300">Click button to test dependencies</p>
        ) : (
          hookResults.map((result, index) => (
            <div key={index} className={`text-sm font-mono ${
              result.includes('✅') ? 'text-green-400' : 'text-red-400'
            }`}>
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TestBlackjackGameComponent: React.FC = () => {
  const [componentVersion, setComponentVersion] = useState<'none' | 'minimal' | 'full'>('none');
  
  return (
    <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
      <h2 className="text-xl font-semibold text-white mb-4">🎯 BlackjackGame Component Test</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setComponentVersion('none')}
          className={`px-3 py-2 rounded text-sm transition-all ${
            componentVersion === 'none' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
          } text-white`}
        >
          None
        </button>
        <button
          onClick={() => setComponentVersion('minimal')}
          className={`px-3 py-2 rounded text-sm transition-all ${
            componentVersion === 'minimal' ? 'bg-green-600' : 'bg-green-700 hover:bg-green-600'
          } text-white`}
        >
          Minimal Game
        </button>
        <button
          onClick={() => setComponentVersion('full')}
          className={`px-3 py-2 rounded text-sm transition-all ${
            componentVersion === 'full' ? 'bg-blue-600' : 'bg-blue-700 hover:bg-blue-600'
          } text-white`}
        >
          Real BlackjackGame
        </button>
      </div>
      
      {componentVersion === 'minimal' && (
        <ErrorBoundary componentName="BlackjackGame Minimal">
          <BlackjackGameMinimal />
        </ErrorBoundary>
      )}
      
      {componentVersion === 'full' && (
        <ErrorBoundary componentName="BlackjackGame Real">
          <div className="bg-primary-900 rounded-sm p-4">
            <p className="text-primary-200 mb-4 text-center">
              🎯 Loading Real BlackjackGame Component...
            </p>
            <BlackjackGame />
          </div>
        </ErrorBoundary>
      )}
      
      {componentVersion === 'none' && (
        <div className="text-primary-300 text-center py-4">
          Select a component version to test above
        </div>
      )}
    </div>
  );
};

export const BlackjackGameDebug: React.FC = () => {
  const [debugMode, setDebugMode] = useState<'dependencies' | 'components' | 'game' | 'flow' | 'monitor'>('dependencies');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🔧 BlackjackGame Debug & Fix
      </h1>
      
      {/* Debug Mode Selector */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setDebugMode('dependencies')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'dependencies' ? 'bg-blue-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🧪 Test Dependencies
        </button>
        <button
          onClick={() => setDebugMode('components')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'components' ? 'bg-green-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🎯 Test Components
        </button>
        <button
          onClick={() => setDebugMode('game')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'game' ? 'bg-purple-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🎮 Test Game
        </button>
        <button
          onClick={() => setDebugMode('flow')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'flow' ? 'bg-orange-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🎯 Game Flow
        </button>
        <button
          onClick={() => setDebugMode('monitor')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'monitor' ? 'bg-pink-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🔍 State Monitor
        </button>
      </div>

      {/* Dependencies Testing */}
      {debugMode === 'dependencies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary componentName="Dependencies Test">
            <TestHooks />
          </ErrorBoundary>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-3">📋 Dependencies Info</h3>
            <div className="text-primary-300 text-sm space-y-2">
              <p>This tests if all BlackjackGame dependencies can be imported:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>useBlackjackGame</code> hook</li>
                <li><code>useBlackjackResults</code> hook</li>
                <li><code>GameTable</code> component</li>
                <li><code>BettingControls</code> component</li>
                <li><code>BlackjackControls</code> component</li>
                <li><code>config</code> from environment</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Component Testing */}
      {debugMode === 'components' && (
        <ErrorBoundary componentName="Component Import Testing">
          <TestActualImports />
        </ErrorBoundary>
      )}

      {/* Game Testing */}
      {debugMode === 'game' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary componentName="Component Test">
            <TestBlackjackGameComponent />
          </ErrorBoundary>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-3">🎮 Game Testing Steps</h3>
            <ol className="text-primary-300 text-sm space-y-2 list-decimal list-inside">
              <li>Start with "Minimal Game" to test basic functionality</li>
              <li>Verify Deal → Hit/Stand → New Game workflow</li>
              <li>Check error boundaries catch any issues</li>
              <li>Compare with "🧪 Blackjack Test" reference</li>
              <li>Once minimal works, try "Full Game"</li>
              <li>Fix any errors step by step</li>
            </ol>
          </div>
        </div>
      )}

      {/* Game Flow Testing */}
      {debugMode === 'flow' && (
        <ErrorBoundary componentName="Game Flow Debug">
          <GameFlowDebug />
        </ErrorBoundary>
      )}

      {/* State Monitoring */}
      {debugMode === 'monitor' && (
        <ErrorBoundary componentName="State Monitor">
          <BlackjackGameStateMonitor />
        </ErrorBoundary>
      )}
    </div>
  );
};