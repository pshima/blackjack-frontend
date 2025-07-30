import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { BlackjackGameFixed } from '../game/BlackjackGameFixed';
import { cardGameApi } from '../../services/cardgame-api';

export const BlackjackGameFixedTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendConnectivity = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🔄 Testing backend connectivity...');
      
      // Test hello endpoint
      const hello = await cardGameApi.healthCheck();
      addResult(`✅ Hello endpoint: ${hello.message}`);
      
      // Test create game
      const game = await cardGameApi.createGame(1, 'standard', 1);
      addResult(`✅ Create game: ${game.game_id.slice(-8)}`);
      
      // Test add player
      const player = await cardGameApi.addPlayer(game.game_id, 'TestPlayer');
      addResult(`✅ Add player: ${player.player_id.slice(-8)}`);
      
      // Test shuffle deck BEFORE starting blackjack
      const shuffleResult = await cardGameApi.shuffleDeck(game.game_id);
      addResult(`✅ Shuffle deck: ${shuffleResult.remaining_cards} cards remaining`);
      
      // Test start blackjack (deals cards from shuffled deck)
      await cardGameApi.startBlackjackGame(game.game_id);
      addResult(`✅ Start blackjack: Game started with dealt cards`);
      
      // Test get final state
      const finalState = await cardGameApi.getGameState(game.game_id);
      addResult(`✅ Final state: ${finalState.players[0].cards.length} cards dealt to player`);
      addResult(`✅ Final state: ${finalState.dealer.cards.length} cards dealt to dealer`);
      
      addResult('🎯 Backend connectivity test PASSED - All APIs working correctly');
      
    } catch (error) {
      addResult(`❌ Backend test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testGameFlowSequence = () => {
    addResult('📋 Expected BlackjackGameFixed flow:');
    addResult('1. User clicks "Deal Cards"');
    addResult('2. Component calls createNewGame() API');
    addResult('3. Component calls addPlayer() API');  
    addResult('4. Component calls shuffleDeck() API (shuffles deck BEFORE dealing)');
    addResult('5. Component calls startBlackjackGame() API (deals cards from shuffled deck)');
    addResult('6. Component shows dealt cards and game controls');
    addResult('✨ This fixes the original issue where Deal Cards only called game state APIs');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🎯 BlackjackGameFixed - Complete Test
      </h1>
      
      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Backend Test */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">🔌 Backend API Test</h2>
          
          <button
            onClick={testBackendConnectivity}
            disabled={isRunning}
            className={`w-full mb-4 px-4 py-3 rounded font-bold transition-all ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? '🔄 Testing APIs...' : '🧪 Test Complete API Flow'}
          </button>
          
          <button
            onClick={testGameFlowSequence}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-bold transition-all"
          >
            📋 Show Expected Game Flow
          </button>
        </div>
        
        {/* Component Test */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">🎮 Component Test</h2>
          
          <button
            onClick={() => setShowGame(!showGame)}
            className={`w-full mb-4 px-4 py-3 rounded font-bold transition-all ${
              showGame 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {showGame ? '❌ Hide BlackjackGameFixed' : '👁️ Show BlackjackGameFixed'}
          </button>
          
          <div className="text-sm text-primary-300">
            <p className="mb-2">🎯 Test Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click "Show BlackjackGameFixed"</li>
              <li>Click "Deal Cards" button</li>
              <li>Watch debug console (F12)</li>
              <li>Verify cards are dealt to player & dealer</li>
              <li>Try Hit/Stand actions</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">📋 Test Results</h2>
        
        {testResults.length === 0 ? (
          <div className="text-primary-300 text-center py-8">
            Run a test above to see results
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className={`text-sm font-mono ${
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('🔄') ? 'text-yellow-400' :
                result.includes('🎯') ? 'text-blue-400' :
                'text-primary-300'
              }`}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Component */}
      {showGame && (
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">🎮 BlackjackGameFixed Component</h2>
          <div className="bg-primary-900 p-4 rounded border">
            <ErrorBoundary componentName="BlackjackGameFixed Test">
              <BlackjackGameFixed />
            </ErrorBoundary>
          </div>
        </div>
      )}
      
      {/* Key Differences */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h2 className="text-xl font-semibold text-white mb-4">🔍 BlackjackGameFixed vs Original</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="text-red-400 font-semibold mb-2">❌ Original BlackjackGame Issues:</h3>
            <ul className="list-disc list-inside text-red-300 space-y-1">
              <li>Deal Cards only called refreshGameState()</li>
              <li>No proper game creation sequence</li>
              <li>Missing player addition flow</li>
              <li>Cards never actually dealt</li>
              <li>Incomplete game phase tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="text-green-400 font-semibold mb-2">✅ BlackjackGameFixed Solutions:</h3>
            <ul className="list-disc list-inside text-green-300 space-y-1">
              <li>Clear game phase tracking (betting → creating → playing)</li>
              <li>Proper API sequence: create → add player → start game</li>
              <li>Cards actually dealt via startBlackjackGame()</li>
              <li>Comprehensive error handling & recovery</li>
              <li>Detailed debug logging for troubleshooting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};