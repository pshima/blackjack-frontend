interface GameOverlayProps {
  showBusted: boolean;
  gameResult: 'win' | 'lose' | 'push' | null;
}

// Overlay component for game results and bust notifications
export function GameOverlay({ showBusted, gameResult }: GameOverlayProps) {
  if (!showBusted && !gameResult) return null;

  const getResultText = () => {
    if (showBusted) return 'BUSTED!';
    if (gameResult === 'win') return 'WINNER!';
    if (gameResult === 'lose') return 'LOSER!';
    if (gameResult === 'push') return 'PUSH!';
    return '';
  };

  const getResultColor = () => {
    if (showBusted || gameResult === 'lose') return '#DC2626';
    if (gameResult === 'win') return '#10B981';
    return '#6B7280';
  };

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 z-40 rounded-lg bg-opacity-60 pointer-events-none" />
      
      {/* Result text */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <h1 
          className="font-mono font-bold tracking-wider text-8xl leading-none text-center select-none"
          style={{ 
            color: getResultColor(),
            textShadow: '8px 8px 0px rgba(0, 0, 0, 0.9)',
          }}
        >
          {getResultText()}
        </h1>
      </div>
    </>
  );
}