interface NewGameButtonProps {
  onNewGame: () => void;
}

// Button to start a completely new game session
export function NewGameButton({ onNewGame }: NewGameButtonProps) {
  return (
    <div className="bg-black bg-opacity-50 p-8 max-w-md mx-auto border-2 border-gray-400">
      <button
        onClick={onNewGame}
        className="w-full bg-primary-700 hover:bg-primary-600 text-white px-6 py-3 font-semibold cursor-pointer transition-all mb-6 hover:-translate-y-0.5 hover:shadow-lg shadow-md border-2 border-black"
      >
        Start New Game
      </button>
    </div>
  );
}