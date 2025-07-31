interface GameStatsProps {
  remainingCards: number;
}

// Displays game statistics like remaining cards
export function GameStats({ remainingCards }: GameStatsProps) {
  return (
    <div className="text-center mt-4">
      <div 
        className="inline-block px-4 py-2 bg-black bg-opacity-30 font-mono text-sm font-semibold border-2 border-yellow-400"
        style={{ 
          color: '#D1B200',
        }}
      >
        Cards Remaining: {remainingCards}
      </div>
    </div>
  );
}