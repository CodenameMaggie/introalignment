'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WouldYouRatherGame from '@/components/games/WouldYouRatherGame';
import StreakCounter from '@/components/gamification/StreakCounter';
import ProfileProgress from '@/components/profile/ProfileProgress';

function DashboardInteractiveContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dailyGames, setDailyGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const session = localStorage.getItem('session');
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      setUser(sessionData.user);

      // Load streak data
      const streakRes = await fetch(`/api/engagement/streak?userId=${sessionData.user.id}`);
      const streakData = await streakRes.json();
      setStreak(streakData);

      // Load profile extractions
      const profileRes = await fetch(`/api/profile/extractions?userId=${sessionData.user.id}`);
      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // Load daily games
      const gamesRes = await fetch('/api/games/daily');
      const gamesData = await gamesRes.json();
      setDailyGames(gamesData.games || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      router.push('/login');
    }
  }

  function handleLogout() {
    localStorage.removeItem('session');
    router.push('/');
  }

  function handleGameComplete() {
    // Reload streak and profile data
    loadDashboard();
    setActiveGame(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne mx-auto mb-4"></div>
          <p className="text-charcoal">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const wouldYouRatherGame = dailyGames.find(g => g.game_type === 'would_you_rather');
  const thisOrThatGame = dailyGames.find(g => g.game_type === 'this_or_that');
  const redFlagGame = dailyGames.find(g => g.game_type === 'red_flag_green_flag');

  return (
    <div className="min-h-screen bg-ivory">
      {/* Navigation */}
      <nav className="bg-white border-b border-ivory-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold text-charcoal">
            IntroAlignment
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-charcoal hover:text-charcoal transition">
              Matches
            </Link>
            <Link href="/dashboard-interactive" className="text-charcoal font-semibold">
              Daily Activities
            </Link>
            <Link href="/dashboard/profile" className="text-charcoal hover:text-charcoal transition">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-charcoal hover:text-charcoal transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Stats Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Streak Counter */}
          <StreakCounter streak={streak} />

          {/* Profile Progress */}
          <div className="md:col-span-2">
            <ProfileProgress profile={profile} />
          </div>
        </div>

        {/* Daily Games Section */}
        <div className="mb-8">
          <h2 className="font-serif text-3xl text-charcoal mb-6">Today's Activities</h2>

          {activeGame === 'would_you_rather' && wouldYouRatherGame ? (
            <WouldYouRatherGame
              game={wouldYouRatherGame}
              userId={user.id}
              onComplete={handleGameComplete}
              onClose={() => setActiveGame(null)}
            />
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Would You Rather Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-champagne-light bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤔</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-charcoal">Would You Rather</h3>
                    <p className="text-sm text-charcoal-light">10 questions • 10 pts</p>
                  </div>
                </div>
                <p className="text-charcoal-light mb-4">
                  Fun scenarios that reveal your priorities and values
                </p>
                {streak?.today?.daily_game_completed ? (
                  <div className="py-3 px-6 bg-success bg-opacity-10 text-success rounded-full text-center font-medium">
                    ✓ Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGame('would_you_rather')}
                    className="w-full py-3 px-6 bg-champagne text-charcoal-dark rounded-full hover:bg-champagne-light transition font-semibold"
                  >
                    Start Game
                  </button>
                )}
              </div>

              {/* This or That Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-champagne-light bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-charcoal">This or That</h3>
                    <p className="text-sm text-charcoal-light">Quick picks • 5 pts</p>
                  </div>
                </div>
                <p className="text-charcoal-light mb-4">
                  Quick choices that reveal your preferences
                </p>
                <button
                  disabled
                  className="w-full py-3 px-6 bg-charcoal-light text-white rounded-full opacity-50 cursor-not-allowed font-medium"
                >
                  Coming Soon
                </button>
              </div>

              {/* Red Flag Green Flag Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-soft-gray bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🚩</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-charcoal">Red or Green Flag?</h3>
                    <p className="text-sm text-charcoal-light">Judge scenarios • 10 pts</p>
                  </div>
                </div>
                <p className="text-charcoal-light mb-4">
                  Rate dating scenarios to reveal your dealbreakers
                </p>
                <button
                  disabled
                  className="w-full py-3 px-6 bg-charcoal-light text-white rounded-full opacity-50 cursor-not-allowed font-medium"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Activities */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Puzzle */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-serif text-2xl text-charcoal mb-4">Daily Puzzle</h3>
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">🧩</span>
              <p className="text-charcoal-light mb-4">Word puzzle coming soon!</p>
              <button
                disabled
                className="py-3 px-6 bg-charcoal-light text-white rounded-full opacity-50 cursor-not-allowed font-medium"
              >
                Play Puzzle
              </button>
            </div>
          </div>

          {/* Community */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-serif text-2xl text-charcoal mb-4">Community</h3>
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-charcoal-light mb-4">Join discussions and polls!</p>
              <button
                disabled
                className="py-3 px-6 bg-charcoal-light text-white rounded-full opacity-50 cursor-not-allowed font-medium"
              >
                View Discussions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardInteractivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    }>
      <DashboardInteractiveContent />
    </Suspense>
  );
}
