import type { GameStateResponse } from '../../types/cardgame';

interface GameControlsMainProps {
  gamePhase: 'playing' | 'dealer-turn' | 'finished';
  gameState: GameStateResponse | null;
  isDealLoading: boolean;
  isLoading: boolean;
  onDeal: () => void;
  onHit: () => void;
  onStand: () => void;
}


// Main game control buttons for dealing cards and player actions
export function GameControlsMain({
  gamePhase,
  gameState,
  isDealLoading,
  isLoading,
  onDeal,
  onHit,
  onStand
}: GameControlsMainProps) {
  // Show Deal button when game is not in progress
  if (gamePhase === 'playing' && gameState?.status !== 'in_progress') {
    const disabled = isDealLoading || gameState?.status === 'in_progress';
    
    return (
      <button
        onClick={onDeal}
        disabled={disabled}
        className="px-6 py-3 text-white font-semibold transition-all min-w-32 bg-primary-700 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:transform-none shadow-md border-2 border-black"
      >
        {isDealLoading ? 'Dealing...' : 'Deal'}
      </button>
    );
  }

  // Show Hit/Stand buttons during active gameplay
  if (gamePhase === 'playing' && gameState?.status === 'in_progress') {
    const player = gameState?.players?.[0];
    const hitDisabled = isLoading || 
      (player?.hand_value >= 21) || 
      player?.is_busted ||
      gameState?.status === 'finished';
    
    const standDisabled = isLoading || 
      player?.is_busted ||
      gameState?.status === 'finished';

    return (
      <div className="flex justify-center gap-4">
        {/* Hit Button */}
        <button
          onClick={onHit}
          disabled={hitDisabled}
          className="px-6 py-3 text-white font-semibold transition-all min-w-24 bg-primary-700 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:transform-none shadow-md border-2 border-black"
        >
          Hit
        </button>

        {/* Stand Button */}
        <button
          onClick={onStand}
          disabled={standDisabled}
          className="px-6 py-3 text-white font-semibold transition-all min-w-24 bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:transform-none shadow-md border-2 border-black"
        >
          Stand
        </button>
      </div>
    );
  }

  // No buttons shown during dealer's turn or when finished
  return null;
}