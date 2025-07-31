// Game header component with retro-style title
export function GameHeader() {
  return (
    <h1 
      className="text-8xl font-bold mb-16 select-none font-mono tracking-wider"
      style={{ 
        color: '#D1B200',
        textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
      }}
    >
      BLACKJACK
    </h1>
  );
}