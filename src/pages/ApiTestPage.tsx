import React, { useState } from 'react';
import { cardGameApi } from '../services/cardgame-api';
import { useBlackjackGame } from '../hooks/useBlackjackGame';
import { useGameList } from '../hooks/useGameList';
import { useDeckTypes } from '../hooks/useDeckTypes';

export const ApiTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  
  const gameList = useGameList(true);
  const deckTypes = useDeckTypes();
  const blackjackGame = useBlackjackGame(currentPlayerId);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testHealthCheck = async () => {
    try {
      const result = await cardGameApi.healthCheck();
      addTestResult(`✅ Health check successful: ${result.message}`);
    } catch (error) {
      addTestResult(`❌ Health check failed: ${error}`);
    }
  };

  const testCreateGame = async () => {
    try {
      await blackjackGame.createNewGame(2, 'standard', 4);
      if (blackjackGame.gameId) {
        setCurrentGameId(blackjackGame.gameId);
        addTestResult(`✅ Game created successfully: ${blackjackGame.gameId}`);
      }
    } catch (error) {
      addTestResult(`❌ Create game failed: ${error}`);
    }
  };

  const testAddPlayer = async () => {
    try {
      const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
      await blackjackGame.addPlayer(playerName);
      addTestResult(`✅ Player added successfully: ${playerName}`);
      
      // Find the newly added player and set their ID
      const newPlayer = blackjackGame.players.find(p => p.name === playerName);
      if (newPlayer) {
        setCurrentPlayerId(newPlayer.id);
      }
    } catch (error) {
      addTestResult(`❌ Add player failed: ${error}`);
    }
  };

  const testStartGame = async () => {
    try {
      await blackjackGame.startGame();
      addTestResult(`✅ Game started successfully`);
    } catch (error) {
      addTestResult(`❌ Start game failed: ${error}`);
    }
  };

  const testHit = async () => {
    try {
      await blackjackGame.hit();
      addTestResult(`✅ Hit successful`);
    } catch (error) {
      addTestResult(`❌ Hit failed: ${error}`);
    }
  };

  const testStand = async () => {
    try {
      await blackjackGame.stand();
      addTestResult(`✅ Stand successful`);
    } catch (error) {
      addTestResult(`❌ Stand failed: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Card Game API Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Test Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">API Tests</h2>
          <div className="space-y-2">
            <button
              onClick={testHealthCheck}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600"
            >
              Test Health Check
            </button>
            <button
              onClick={testCreateGame}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-sm hover:bg-green-600"
            >
              Create New Game
            </button>
            <button
              onClick={testAddPlayer}
              disabled={!blackjackGame.gameId}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded-sm hover:bg-purple-600 disabled:bg-gray-300"
            >
              Add Player
            </button>
            <button
              onClick={testStartGame}
              disabled={!blackjackGame.gameId || blackjackGame.players.length === 0}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded-sm hover:bg-yellow-600 disabled:bg-gray-300"
            >
              Start Game
            </button>
            <button
              onClick={testHit}
              disabled={!blackjackGame.isGameStarted || !currentPlayerId}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-sm hover:bg-red-600 disabled:bg-gray-300"
            >
              Hit
            </button>
            <button
              onClick={testStand}
              disabled={!blackjackGame.isGameStarted || !currentPlayerId}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded-sm hover:bg-orange-600 disabled:bg-gray-300"
            >
              Stand
            </button>
          </div>
        </div>

        {/* Game State */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Current Game State</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Game ID:</strong> {blackjackGame.gameId || 'None'}</p>
            <p><strong>Status:</strong> {blackjackGame.gameState?.status || 'None'}</p>
            <p><strong>Players:</strong> {blackjackGame.players.length}</p>
            <p><strong>Current Player ID:</strong> {currentPlayerId || 'None'}</p>
            <p><strong>Remaining Cards:</strong> {blackjackGame.remainingCards}</p>
          </div>
        </div>
      </div>

      {/* Available Games */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">
          Available Games ({gameList.gameCount})
        </h2>
        {gameList.isLoading ? (
          <p>Loading games...</p>
        ) : gameList.error ? (
          <p className="text-red-500">Error: {gameList.error}</p>
        ) : (
          <div className="space-y-1">
            {gameList.games.map((gameId) => (
              <div key={gameId} className="flex items-center justify-between">
                <code className="text-sm">{gameId}</code>
                <button
                  onClick={() => gameList.deleteGame(gameId)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deck Types */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-3">Available Deck Types</h2>
        {deckTypes.isLoading ? (
          <p>Loading deck types...</p>
        ) : deckTypes.error ? (
          <p className="text-red-500">Error: {deckTypes.error}</p>
        ) : (
          <div className="space-y-2">
            {deckTypes.deckTypes.map((deck) => (
              <div key={deck.id} className="border-b pb-2">
                <p className="font-medium">{deck.name}</p>
                <p className="text-sm text-gray-600">{deck.description}</p>
                <p className="text-sm">Cards per deck: {deck.cards_per_deck}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Test Results</h2>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            testResults.map((result, index) => (
              <p key={index} className="text-sm font-mono">
                {result}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};