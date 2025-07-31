import type { Player } from '../../types/cardgame';

interface PlayerSectionProps {
  player: Player | null;
  getCardBackUrl: () => string;
}

// Displays player cards and score section
export function PlayerSection({ player, getCardBackUrl }: PlayerSectionProps) {
  return (
    <div className="flex-1" style={{ marginRight: '5%' }}>
      {/* Player Header with Score */}
      <div className="text-center mb-8">
        <h2 
          className="text-4xl font-bold select-none inline-block font-mono tracking-wider"
          style={{ 
            color: '#D1B200',
            textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
          }}
        >
          PLAYER
        </h2>
        {player && (
          <span 
            className="ml-4 text-2xl font-bold select-none font-mono"
            style={{ 
              color: '#D1B200',
              textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
            }}
          >
            ({player.hand_value || 0})
          </span>
        )}
      </div>
      
      {/* Player Card Area */}
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="relative flex">
          {player?.hand && player.hand.length > 0 ? (
            player.hand.map((card, index) => (
              <div 
                key={index}
                className="relative"
                style={{
                  marginLeft: index > 0 ? '-20px' : '0',
                  zIndex: index + 1
                }}
              >
                <img
                  src={card.face_up && card.images?.small 
                    ? card.images.small 
                    : getCardBackUrl()}
                  alt={card.face_up ? `${card.rank} of ${card.suit}` : 'Card back'}
                  className="w-16 h-24 rounded shadow-lg"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            ))
          ) : (
            <div 
              className="w-16 h-24 rounded border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              Cards
            </div>
          )}
        </div>
      </div>
    </div>
  );
}