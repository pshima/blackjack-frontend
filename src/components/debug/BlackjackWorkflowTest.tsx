import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

type WorkflowStep = 'navigate' | 'create-game' | 'place-bet' | 'hit-stand' | 'game-over';

interface WorkflowState {
  currentStep: WorkflowStep;
  gameId: string | null;
  playerId: string | null;
  balance: number;
  currentBet: number;
  playerHand: string[];
  dealerHand: string[];
  playerHandValue: number;
  dealerHandValue: number;
  gameStatus: string;
}

export const BlackjackWorkflowTest: React.FC = () => {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    currentStep: 'navigate',
    gameId: null,
    playerId: null,
    balance: 1000,
    currentBet: 10,
    playerHand: [],
    dealerHand: [],
    playerHandValue: 0,
    dealerHandValue: 0,
    gameStatus: 'waiting'
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  const simulateCreateGame = () => {
    addLog('🎯 Step 1: Creating new game...');
    try {
      // Simulate API call delay
      setTimeout(() => {
        const mockGameId = `game_${Date.now()}`;
        const mockPlayerId = `player_${Date.now()}`;
        
        setWorkflow(prev => ({
          ...prev,
          currentStep: 'create-game',
          gameId: mockGameId,
          playerId: mockPlayerId,
          gameStatus: 'waiting'
        }));
        
        addLog(`✅ Game created successfully! GameID: ${mockGameId}`);
        addLog(`✅ Player added successfully! PlayerID: ${mockPlayerId}`);
      }, 500);
    } catch (error) {
      addLog(`❌ Failed to create game: ${error}`);
    }
  };

  const simulatePlaceBet = (betAmount: number) => {
    addLog(`🎯 Step 2: Placing bet of $${betAmount}...`);
    try {
      if (betAmount > workflow.balance) {
        throw new Error('Insufficient balance');
      }
      
      setWorkflow(prev => ({
        ...prev,
        currentStep: 'place-bet',
        currentBet: betAmount,
        balance: prev.balance - betAmount,
        gameStatus: 'in_progress',
        playerHand: ['A♠', 'K♦'], // Mock initial cards
        dealerHand: ['?', '7♣'],
        playerHandValue: 21,
        dealerHandValue: 7
      }));
      
      addLog(`✅ Bet placed successfully! Amount: $${betAmount}`);
      addLog(`✅ Cards dealt! Player: A♠ K♦ (21), Dealer: ? 7♣`);
    } catch (error) {
      addLog(`❌ Failed to place bet: ${error}`);
    }
  };

  const simulateHit = () => {
    addLog('🎯 Step 3a: Player chooses to HIT...');
    try {
      const newCard = ['2♠', '3♥', '4♦', '5♣', '6♠'][Math.floor(Math.random() * 5)];
      const newValue = workflow.playerHandValue + parseInt(newCard);
      
      setWorkflow(prev => ({
        ...prev,
        currentStep: 'hit-stand',
        playerHand: [...prev.playerHand, newCard],
        playerHandValue: newValue,
        gameStatus: newValue > 21 ? 'finished' : 'in_progress'
      }));
      
      addLog(`✅ Hit successful! Drew: ${newCard}, New total: ${newValue}`);
      
      if (newValue > 21) {
        addLog(`💥 BUST! Player busted with ${newValue}`);
        setTimeout(() => simulateGameOver('bust'), 1000);
      }
    } catch (error) {
      addLog(`❌ Failed to hit: ${error}`);
    }
  };

  const simulateStand = () => {
    addLog('🎯 Step 3b: Player chooses to STAND...');
    try {
      // Simulate dealer play
      const dealerCards = ['K♠', '6♥'];
      const dealerTotal = 17;
      
      setWorkflow(prev => ({
        ...prev,
        currentStep: 'hit-stand',
        dealerHand: dealerCards,
        dealerHandValue: dealerTotal,
        gameStatus: 'finished'
      }));
      
      addLog(`✅ Stand successful! Dealer reveals: K♠ 6♥ (17)`);
      setTimeout(() => simulateGameOver('compare'), 1000);
    } catch (error) {
      addLog(`❌ Failed to stand: ${error}`);
    }
  };

  const simulateGameOver = (result: 'bust' | 'compare') => {
    addLog('🎯 Step 4: Game ending...');
    
    let outcome = '';
    let winnings = 0;
    
    if (result === 'bust') {
      outcome = 'Player Busted - Dealer Wins';
      winnings = 0;
    } else {
      if (workflow.playerHandValue > workflow.dealerHandValue) {
        outcome = 'Player Wins!';
        winnings = workflow.currentBet * 2;
      } else if (workflow.playerHandValue < workflow.dealerHandValue) {
        outcome = 'Dealer Wins';
        winnings = 0;
      } else {
        outcome = 'Push (Tie)';
        winnings = workflow.currentBet;
      }
    }
    
    setWorkflow(prev => ({
      ...prev,
      currentStep: 'game-over',
      balance: prev.balance + winnings
    }));
    
    addLog(`🏁 Game Over: ${outcome}`);
    addLog(`💰 Winnings: $${winnings}, New Balance: $${workflow.balance + winnings}`);
  };

  const resetWorkflow = () => {
    setWorkflow({
      currentStep: 'navigate',
      gameId: null,
      playerId: null,
      balance: 1000,
      currentBet: 10,
      playerHand: [],
      dealerHand: [],
      playerHandValue: 0,
      dealerHandValue: 0,
      gameStatus: 'waiting'
    });
    setLogs([]);
    addLog('🔄 Workflow reset - Ready to start new test');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🧪 Blackjack Workflow Test
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Controls */}
        <ErrorBoundary componentName="Workflow Controls">
          <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
            <h2 className="text-xl font-semibold text-white mb-4">
              Workflow Steps
            </h2>
            
            <div className="space-y-3">
              {/* Step 1: Navigate & Create Game */}
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  workflow.currentStep === 'navigate' ? 'bg-blue-600 text-white' :
                  ['create-game', 'place-bet', 'hit-stand', 'game-over'].includes(workflow.currentStep) ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  1
                </span>
                <button
                  onClick={simulateCreateGame}
                  disabled={workflow.currentStep !== 'navigate'}
                  className="flex-1 text-left bg-primary-700 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-all"
                >
                  Navigate to Blackjack → Create Game
                </button>
              </div>

              {/* Step 2: Place Bet */}
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  workflow.currentStep === 'create-game' ? 'bg-blue-600 text-white' :
                  ['place-bet', 'hit-stand', 'game-over'].includes(workflow.currentStep) ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  2
                </span>
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => simulatePlaceBet(10)}
                    disabled={workflow.currentStep !== 'create-game'}
                    className="bg-primary-700 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-all"
                  >
                    Bet $10
                  </button>
                  <button
                    onClick={() => simulatePlaceBet(25)}
                    disabled={workflow.currentStep !== 'create-game'}
                    className="bg-primary-700 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-all"
                  >
                    Bet $25
                  </button>
                  <button
                    onClick={() => simulatePlaceBet(50)}
                    disabled={workflow.currentStep !== 'create-game'}
                    className="bg-primary-700 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-all"
                  >
                    Bet $50
                  </button>
                </div>
              </div>

              {/* Step 3: Hit or Stand */}
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  workflow.currentStep === 'place-bet' ? 'bg-blue-600 text-white' :
                  ['hit-stand', 'game-over'].includes(workflow.currentStep) ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  3
                </span>
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={simulateHit}
                    disabled={workflow.currentStep !== 'place-bet' || workflow.gameStatus === 'finished'}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-all"
                  >
                    🃏 HIT
                  </button>
                  <button
                    onClick={simulateStand}
                    disabled={workflow.currentStep !== 'place-bet' || workflow.gameStatus === 'finished'}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-all"
                  >
                    ✋ STAND
                  </button>
                </div>
              </div>

              {/* Reset */}
              <div className="pt-4 border-t border-primary-600">
                <button
                  onClick={resetWorkflow}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-all"
                >
                  🔄 Reset Workflow Test
                </button>
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {/* Game State Display */}
        <ErrorBoundary componentName="Game State Display">
          <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current Game State
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-300">Step:</span>
                <span className="text-white font-mono">{workflow.currentStep}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Game ID:</span>
                <span className="text-white font-mono">{workflow.gameId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Player ID:</span>
                <span className="text-white font-mono">{workflow.playerId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Balance:</span>
                <span className="text-green-400 font-bold">${workflow.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Current Bet:</span>
                <span className="text-yellow-400 font-bold">${workflow.currentBet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Status:</span>
                <span className="text-white font-mono">{workflow.gameStatus}</span>
              </div>
              
              {workflow.playerHand.length > 0 && (
                <>
                  <div className="pt-2 border-t border-primary-600">
                    <div className="flex justify-between">
                      <span className="text-primary-300">Player Hand:</span>
                      <span className="text-white">{workflow.playerHand.join(' ')} ({workflow.playerHandValue})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-300">Dealer Hand:</span>
                      <span className="text-white">{workflow.dealerHand.join(' ')} ({workflow.dealerHandValue || '?'})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>

      {/* Activity Log */}
      <ErrorBoundary componentName="Activity Log">
        <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            📋 Activity Log
          </h2>
          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet. Start the workflow test above.</p>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('🎯') ? 'text-blue-400' :
                    log.includes('🏁') ? 'text-yellow-400' :
                    log.includes('💰') ? 'text-green-300' :
                    'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};