interface NewGameButtonProps {
  onNewGame: () => void;
}

// Button to start a completely new game session
export function NewGameButton({ onNewGame }: NewGameButtonProps) {
  return (
    <div className="bg-black bg-opacity-50 rounded-lg p-8 max-w-md mx-auto">
      <button
        onClick={onNewGame}
        className="w-full bg-primary-700 hover:bg-primary-600 text-white px-6 py-3 rounded-sm font-semibold cursor-pointer transition-all mb-6 hover:-translate-y-0.5 hover:shadow-lg shadow-md"
      >
        Start New Game
      </button>
    </div>
  );
}