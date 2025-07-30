import React from 'react';
import { Hand } from './Hand';
import { GameResult } from './GameResult';
import type { Player } from '../../types/cardgame';

interface GameTableProps {
  dealer: Player | null;
  player: Player | null;
  hideFirstDealerCard?: boolean;
  gameStatus?: string;
  remainingCards?: number;
  className?: string;
}

export const GameTable: React.FC<GameTableProps> = ({
  dealer,
  player,
  hideFirstDealerCard = false,
  gameStatus,
  remainingCards,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Table Background */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 rounded-2xl p-8 shadow-2xl border border-primary-600">
        
        {/* Table Felt Pattern */}
        <div className="absolute inset-4 bg-primary-700 rounded-xl opacity-30"></div>
        
        {/* Game Status Header */}
        <div className="relative z-10 text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Blackjack Table</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-primary-200">
            {gameStatus && (
              <span className="capitalize font-medium">
                Status: <span className="text-white">{gameStatus}</span>
              </span>
            )}
            {remainingCards !== undefined && (
              <span className="font-medium">
                Cards Left: <span className="text-white">{remainingCards}</span>
              </span>
            )}
          </div>
        </div>

        {/* Dealer Section */}
        <div className="relative z-10 mb-12">
          <Hand
            cards={dealer?.hand || []}
            title="Dealer"
            handValue={hideFirstDealerCard ? undefined : dealer?.hand_value}
            isDealer={true}
            hideFirstCard={hideFirstDealerCard}
            className="mb-4"
          />
        </div>

        {/* Center Line */}
        <div className="relative z-10 flex items-center justify-center mb-12">
          <div className="flex-1 h-px bg-primary-600"></div>
          <div className="px-4 text-primary-300 text-sm font-medium">VS</div>
          <div className="flex-1 h-px bg-primary-600"></div>
        </div>

        {/* Player Section */}
        <div className="relative z-10">
          <Hand
            cards={player?.hand || []}
            title="Your Hand"
            handValue={player?.hand_value}
            className="mb-4"
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary-500 rounded-tl-lg opacity-50"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary-500 rounded-tr-lg opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary-500 rounded-bl-lg opacity-50"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary-500 rounded-br-lg opacity-50"></div>
      </div>

      {/* Game Result Overlay */}
      {gameStatus === 'finished' && player && dealer && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <GameResult 
              playerValue={player.hand_value || 0}
              dealerValue={dealer.hand_value || 0}
              playerHasBlackjack={player.has_blackjack || false}
              dealerHasBlackjack={dealer.has_blackjack || false}
              playerIsBusted={player.is_busted || false}
              dealerIsBusted={dealer.is_busted || false}
            />
          </div>
        </div>
      )}
    </div>
  );
};


export default GameTable;