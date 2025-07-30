/**
 * PlayerStats Component
 * Displays player statistics and game history
 */

import { usePlayerState } from '../../stores/gameStore';
import { logger } from '../../services/monitoring';
import LoadingSpinner from '../common/LoadingSpinner';

interface PlayerStatsProps {
  className?: string;
}

export default function PlayerStats({ className = '' }: PlayerStatsProps) {
  const playerState = usePlayerState();

  if (!playerState) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="sm" message="Loading player data..." />
        </div>
      </div>
    );
  }

  // Log stats view
  logger.debug('PlayerStats rendered', {
    userId: playerState.id,
    balance: playerState.balance,
    gamesPlayed: playerState.stats?.gamesPlayed
  });

  const stats = playerState.stats || {
    gamesPlayed: 0,
    gamesWon: 0,
    totalWinnings: 0,
    blackjacks: 0,
    winStreak: 0,
    bestWinStreak: 0
  };

  const winRate = stats.gamesPlayed > 0 
    ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  const averageWinnings = stats.gamesPlayed > 0
    ? (stats.totalWinnings / stats.gamesPlayed).toFixed(2)
    : '0.00';

  const statItems = [
    {
      label: 'Balance',
      value: `$${playerState.balance}`,
      color: playerState.balance >= 1000 ? 'text-green-600' : 'text-red-600',
      icon: '💰'
    },
    {
      label: 'Games Played',
      value: stats.gamesPlayed.toString(),
      color: 'text-gray-700',
      icon: '🎮'
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      color: parseFloat(winRate) >= 50 ? 'text-green-600' : 'text-red-600',
      icon: '📊'
    },
    {
      label: 'Total Winnings',
      value: `$${stats.totalWinnings}`,
      color: stats.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600',
      icon: '💎'
    },
    {
      label: 'Blackjacks',
      value: stats.blackjacks.toString(),
      color: 'text-yellow-600',
      icon: '🃏'
    },
    {
      label: 'Win Streak',
      value: stats.winStreak.toString(),
      color: stats.winStreak > 0 ? 'text-green-600' : 'text-gray-700',
      icon: '🔥'
    },
    {
      label: 'Best Streak',
      value: stats.bestWinStreak.toString(),
      color: 'text-purple-600',
      icon: '🏆'
    },
    {
      label: 'Avg. Per Game',
      value: `$${averageWinnings}`,
      color: parseFloat(averageWinnings) >= 0 ? 'text-green-600' : 'text-red-600',
      icon: '⚖️'
    }
  ];

  const getPlayerLevel = (): { level: string; color: string } => {
    const { gamesPlayed } = stats;
    
    if (gamesPlayed >= 1000) return { level: 'High Roller', color: 'text-purple-600' };
    if (gamesPlayed >= 500) return { level: 'Pro Player', color: 'text-blue-600' };
    if (gamesPlayed >= 100) return { level: 'Regular', color: 'text-green-600' };
    if (gamesPlayed >= 20) return { level: 'Amateur', color: 'text-yellow-600' };
    return { level: 'Beginner', color: 'text-gray-600' };
  };

  const playerLevel = getPlayerLevel();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Player Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-3 flex items-center justify-center">
          <span className="text-2xl text-white font-bold">
            {playerState.name ? playerState.name.charAt(0).toUpperCase() : 'P'}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {playerState.name || 'Player'}
        </h3>
        <p className={`text-sm font-medium ${playerLevel.color}`}>
          {playerLevel.level}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
          Statistics
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          {statItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <span className={`font-semibold ${item.color}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      {(stats.blackjacks > 0 || stats.bestWinStreak >= 5 || stats.gamesPlayed >= 100) && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
            Achievements
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.blackjacks > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                🃏 Blackjack Master
              </span>
            )}
            {stats.bestWinStreak >= 5 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                🔥 Hot Streak
              </span>
            )}
            {stats.gamesPlayed >= 100 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🎮 Veteran Player
              </span>
            )}
            {stats.totalWinnings >= 5000 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                💰 Big Winner
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tips for new players */}
      {stats.gamesPlayed < 10 && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Pro Tip
          </h4>
          <p className="text-xs text-blue-700">
            {stats.gamesPlayed === 0 
              ? "Welcome! Start with small bets to learn the game."
              : stats.gamesPlayed < 5
              ? "Try to get as close to 21 as possible without going over."
              : "Consider the dealer's up card when deciding to hit or stand."
            }
          </p>
        </div>
      )}
    </div>
  );
}