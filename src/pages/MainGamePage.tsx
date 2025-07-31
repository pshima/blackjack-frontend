import { useState } from 'react';
import { cardGameApi } from '../services/cardgame-api';
import { config } from '../config/environment';
import type { GameStateResponse } from '../types/cardgame';
import { GameHeader } from '../components/game/GameHeader';
import { StartGameButton } from '../components/game/StartGameButton';
import { GameControlsMain } from '../components/game/GameControlsMain';
import { PlayerSection } from '../components/game/PlayerSection';
import { DealerSection } from '../components/game/DealerSection';
import { GameOverlay } from '../components/game/GameOverlay';
import { GameStats } from '../components/game/GameStats';
import { NewGameButton } from '../components/game/NewGameButton';

interface GameStatus {
  gameId: string;
  playerId: string;
  playerName: string;
  message: string;
}

// Main game page component with blackjack gameplay
export function MainGamePage() {
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [isDealLoading, setIsDealLoading] = useState(false);
  const [gamePhase, setGamePhase] = useState<'playing' | 'dealer-turn' | 'finished'>('playing');
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'push' | null>(null);

  // Checks if a player has busted (hand value over 21)
  const isPlayerBusted = (player: unknown) => {
    if (!player || typeof player !== 'object') return false;
    
    const p = player as { is_busted?: boolean; hand_value?: number; hand?: unknown[] };
    
    if (p.is_busted === true) return true;
    if (p.hand_value && p.hand_value > 21) return true;
    
    if (p.hand && p.hand.length > 0) {
      let total = 0;
      let aces = 0;
      
      p.hand.forEach((card: unknown) => {
        const c = card as { face_up?: boolean; rank?: unknown };
        if (c.face_up === false) return;
        
        const rank = String(c.rank);
        if (rank === 'A' || rank === '1') {
          aces += 1;
          total += 11;
        } else if (['K', 'Q', 'J', '13', '12', '11'].includes(rank)) {
          total += 10;
        } else {
          total += parseInt(rank) || 0;
        }
      });
      
      while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
      }
      
      return total > 21;
    }
    
    return false;
  };

  // Gets the URL for card back images from the API server
  const getCardBackUrl = () => {
    const baseUrl = config.apiBaseUrl.replace('/api', '');
    return `${baseUrl}/static/cards/small/back.png`;
  };

  // Generates card image URLs from rank and suit for face-up cards
  const getCardImageUrl = (rank: unknown, suit: unknown) => {
    const baseUrl = config.apiBaseUrl.replace('/api', '');
    return `${baseUrl}/static/cards/small/${rank}_${suit}.png`;
  };

  // Creates a new game and adds a player named 'Gooberhead'
  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const gameResponse = await cardGameApi.createGame(1, 'standard');
      const gameId = gameResponse.game_id;
      
      await cardGameApi.shuffleDeck(gameId);
      
      const playerResponse = await cardGameApi.addPlayer(gameId, 'Gooberhead');
      const playerId = playerResponse.player.id;
      
      setGameStatus({
        gameId,
        playerId,
        playerName: 'Gooberhead',
        message: 'Game created successfully! Deck shuffled and player ready.'
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  // Deals initial cards using the blackjack start game API
  const handleDeal = async () => {
    if (!gameStatus) return;
    
    setIsDealLoading(true);
    setError(null);
    
    try {
      await cardGameApi.startBlackjackGame(gameStatus.gameId);
      const updatedGameState = await cardGameApi.getGameState(gameStatus.gameId);
      setGameState(updatedGameState);
      setGamePhase('playing');
      setGameResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deal cards');
    } finally {
      setIsDealLoading(false);
    }
  };

  // Player takes another card and updates game state
  const handleHit = async () => {
    if (!gameStatus || !gameState) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await cardGameApi.hit(gameStatus.gameId, gameStatus.playerId);
      const updatedGameState = await cardGameApi.getGameState(gameStatus.gameId);
      setGameState(updatedGameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hit');
    } finally {
      setIsLoading(false);
    }
  };

  // Player stands and triggers dealer's turn
  const handleStand = async () => {
    if (!gameStatus || !gameState) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const standResponse = await cardGameApi.stand(gameStatus.gameId, gameStatus.playerId);
      
      if (standResponse.status === 'finished') {
        setGamePhase('finished');
        await handleGameResults();
      } else {
        setGamePhase('dealer-turn');
        await handleDealerTurn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stand');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles dealer's automated turn with card reveals and drawing
  const handleDealerTurn = async () => {
    let currentGameState = await cardGameApi.getGameState(gameStatus!.gameId);
    
    if (currentGameState.dealer && currentGameState.dealer.hand) {
      currentGameState.dealer.hand = currentGameState.dealer.hand.map(card => ({
        ...card,
        face_up: true
      }));
    }
    
    setGameState(currentGameState);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let pollCount = 0;
    while (currentGameState.status === 'in_progress' && pollCount < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollCount++;
      
      const freshGameState = await cardGameApi.getGameState(gameStatus!.gameId);
      
      if (freshGameState.dealer && freshGameState.dealer.hand) {
        freshGameState.dealer.hand = freshGameState.dealer.hand.map(card => ({
          ...card,
          face_up: true
        }));
      }
      
      currentGameState = freshGameState;
      setGameState(currentGameState);
      
      if (currentGameState.status === 'finished') {
        break;
      }
    }
    
    setGamePhase('finished');
    const finalGameState = await cardGameApi.getGameState(gameStatus!.gameId);
    
    if (finalGameState.dealer && finalGameState.dealer.hand) {
      finalGameState.dealer.hand = finalGameState.dealer.hand.map(card => ({
        ...card,
        face_up: true
      }));
    }
    setGameState(finalGameState);
    
    await handleGameResults();
  };

  // Fetches final game results and updates display
  const handleGameResults = async () => {
    try {
      const results = await cardGameApi.getBlackjackResults(gameStatus!.gameId);
      const finalState = await cardGameApi.getGameState(gameStatus!.gameId);
      
      if (finalState.dealer && finalState.dealer.hand) {
        finalState.dealer.hand = finalState.dealer.hand.map(card => ({
          ...card,
          face_up: true
        }));
      }
      setGameState(finalState);
      
      const playerResult = results.players[0]?.result;
      
      if (playerResult === 'win' || playerResult === 'blackjack') {
        setGameResult('win');
      } else if (playerResult === 'push') {
        setGameResult('push');
      } else {
        setGameResult('lose');
      }
    } catch (err) {
      setGameResult('lose');
    }
  };

  // Reset all game state to start fresh
  const handleNewGame = () => {
    setGameStatus(null);
    setGameState(null);
    setIsLoading(false);
    setIsDealLoading(false);
    setError(null);
    setGamePhase('playing');
    setGameResult(null);
  };

  // Check if player has busted for overlay display
  const player = gameState?.players?.[0];
  const showBusted = player && isPlayerBusted(player);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#008000' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <GameHeader />

        {!gameStatus ? (
          <StartGameButton 
            onStartGame={handleStartGame}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div className="w-full max-w-6xl mx-auto px-4">
            <div 
              className="p-8 mb-8 relative"
              style={{
                backgroundColor: '#AB6B29',
                border: '3px solid #4A4744',
                minHeight: '400px',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
                backgroundSize: '8px 8px'
              }}
            >
              <GameOverlay showBusted={showBusted} gameResult={gameResult} />

              <div className="text-center mb-6">
                <GameControlsMain
                  gamePhase={gamePhase}
                  gameState={gameState}
                  isDealLoading={isDealLoading}
                  isLoading={isLoading}
                  onDeal={handleDeal}
                  onHit={handleHit}
                  onStand={handleStand}
                />
              </div>

              <div className="flex justify-between items-start h-full">
                <PlayerSection 
                  player={player}
                  getCardBackUrl={getCardBackUrl}
                />
                <DealerSection
                  dealer={gameState?.dealer || null}
                  gamePhase={gamePhase}
                  getCardBackUrl={getCardBackUrl}
                  getCardImageUrl={getCardImageUrl}
                />
              </div>
              
              <GameStats remainingCards={gameState?.remaining_cards || 52} />
            </div>

            <NewGameButton onNewGame={handleNewGame} />
          </div>
        )}

        <div className="fixed bottom-4 right-4">
          <a
            href="/admin"
            className="opacity-10 hover:opacity-100 transition-opacity duration-300 text-xs text-gray-300 hover:text-white"
          >
            🔧
          </a>
        </div>
      </div>
    </div>
  );
}