'use client';

interface StreakData {
  streak: {
    current: number;
    longest: number;
  };
  today: {
    points_earned: number;
    daily_game_completed: boolean;
    daily_puzzle_completed: boolean;
    articles_read: number;
    community_interactions: number;
  };
  totals: {
    points: number;
    level: number;
    days_active: number;
  };
}

interface Props {
  streak: StreakData | null;
}

export default function StreakCounter({ streak }: Props) {
  if (!streak) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-24 bg-cream-dark rounded"></div>
      </div>
    );
  }

  const currentStreak = streak.streak.current;
  const longestStreak = streak.streak.longest;
  const todayPoints = streak.today.points_earned;
  const totalPoints = streak.totals.points;
  const level = streak.totals.level;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl text-navy">Your Streak</h3>
        <span className="text-3xl">🔥</span>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-5xl text-navy">{currentStreak}</span>
          <span className="text-navy-light">days</span>
        </div>
        <p className="text-sm text-navy-light mt-1">
          Longest: {longestStreak} days
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-navy-light">Today's Points</span>
          <span className="text-navy font-semibold">{todayPoints}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy-light">Total Points</span>
          <span className="text-gold font-semibold">{totalPoints}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy-light">Level</span>
          <span className="text-navy font-semibold">{level}</span>
        </div>
      </div>

      {currentStreak >= 7 && (
        <div className="mt-4 p-3 bg-gold bg-opacity-10 rounded-lg">
          <p className="text-sm text-gold font-medium">
            🎉 You're on fire! {currentStreak} day streak!
          </p>
        </div>
      )}
    </div>
  );
}
