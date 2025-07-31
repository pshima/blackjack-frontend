interface StartGameButtonProps {
  onStartGame: () => void;
  isLoading: boolean;
  error: string | null;
}

// Initial start game button when no game is active
export function StartGameButton({ onStartGame, isLoading, error }: StartGameButtonProps) {
  return (
    <div className="flex flex-col items-center space-y-8">
      <button
        onClick={onStartGame}
        disabled={isLoading}
        className="px-6 py-3 rounded text-white font-semibold cursor-pointer transition-all min-w-32 bg-primary-700 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-sm shadow-md"
      >
        {isLoading ? 'Starting Game...' : 'Start Game'}
      </button>
      
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded font-mono">
          Error: {error}
        </div>
      )}
    </div>
  );
}