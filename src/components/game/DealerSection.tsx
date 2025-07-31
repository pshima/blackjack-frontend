import type { Player } from '../../types/cardgame';

interface DealerSectionProps {
  dealer: Player | null;
  gamePhase: 'playing' | 'dealer-turn' | 'finished';
  getCardBackUrl: () => string;
  getCardImageUrl: (rank: unknown, suit: unknown) => string;
}

// Calculates dealer's visible score based on game phase
function calculateDealerScore(dealer: Player | null, gamePhase: string) {
  if (!dealer?.hand || dealer.hand.length === 0) return 0;
  
  // Show all cards during dealer's turn or finished game
  const cardsToCount = gamePhase === 'dealer-turn' || gamePhase === 'finished' 
    ? dealer.hand
    : dealer.hand.filter(card => card.face_up);
  
  if (cardsToCount.length === 0) return '?';
  
  let total = 0;
  let aces = 0;
  
  cardsToCount.forEach(card => {
    const rank = String(card.rank);
    if (rank === 'A' || rank === '1') {
      aces += 1;
      total += 11;
    } else if (['K', 'Q', 'J', '13', '12', '11'].includes(rank)) {
      total += 10;
    } else {
      total += parseInt(rank) || 0;
    }
  });
  
  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  
  return total;
}

// Displays dealer cards and score section
export function DealerSection({ 
  dealer, 
  gamePhase, 
  getCardBackUrl, 
  getCardImageUrl 
}: DealerSectionProps) {
  const dealerScore = calculateDealerScore(dealer, gamePhase);

  return (
    <div className="flex-1" style={{ marginLeft: '5%' }}>
      {/* Dealer Header with Score */}
      <div className="text-center mb-8">
        <h2 
          className="text-4xl font-bold select-none inline-block font-mono tracking-wider"
          style={{ 
            color: '#D1B200',
            textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
          }}
        >
          DEALER
        </h2>
        {dealer && (
          <span 
            className="ml-4 text-2xl font-bold select-none font-mono"
            style={{ 
              color: '#D1B200',
              textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
            }}
          >
            ({dealerScore})
          </span>
        )}
      </div>
      
      {/* Dealer Card Area */}
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="relative flex">
          {dealer?.hand && dealer.hand.length > 0 ? (
            dealer.hand.map((card, index) => (
              <div 
                key={index}
                className="relative"
                style={{
                  marginLeft: index > 0 ? '-20px' : '0',
                  zIndex: index + 1
                }}
              >
                <img
                  src={(() => {
                    const shouldShowCard = card.face_up || gamePhase === 'dealer-turn' || gamePhase === 'finished';
                    
                    if (shouldShowCard) {
                      if (card.images?.small && !card.images.small.includes('back.png')) {
                        return card.images.small;
                      }
                      return getCardImageUrl(card.rank, card.suit);
                    } else {
                      return getCardBackUrl();
                    }
                  })()}
                  alt={card.face_up || gamePhase === 'dealer-turn' || gamePhase === 'finished' 
                    ? `${card.rank} of ${card.suit}` 
                    : 'Card back'}
                  className="w-16 h-24 shadow-lg border-2 border-black"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            ))
          ) : (
            <div 
              className="w-16 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs"
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