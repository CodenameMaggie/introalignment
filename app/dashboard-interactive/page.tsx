'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WouldYouRatherGame from '@/components/games/WouldYouRatherGame';
import ThisOrThatGame from '@/components/games/ThisOrThatGame';
import RedFlagGreenFlagGame from '@/components/games/RedFlagGreenFlagGame';
import FinishSentenceGame from '@/components/games/FinishSentenceGame';
import DailyPuzzleGame from '@/components/games/DailyPuzzleGame';
import StreakCounter from '@/components/gamification/StreakCounter';
import ProfileProgress from '@/components/profile/ProfileProgress';

function DashboardInteractiveContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dailyGames, setDailyGames] = useState<any[]>([]);
  const [dailyPuzzle, setDailyPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<Record<string, boolean>>({});

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

      // Load all game types and check their status
      const gameTypes = ['would_you_rather', 'this_or_that', 'red_flag_green_flag', 'finish_sentence'];
      const gamePromises = gameTypes.map(type =>
        fetch(`/api/games/${type}`).then(res => res.json())
      );
      const gameResults = await Promise.all(gamePromises);

      // Store games and their status
      const games: any[] = [];
      const status: Record<string, boolean> = {};

      gameResults.forEach((result, index) => {
        const gameType = gameTypes[index];
        if (result.alreadyPlayed) {
          status[gameType] = true;
        } else if (result.game) {
          games.push(result.game);
          status[gameType] = false;
        }
      });

      setDailyGames(games);
      setGameStatus(status);

      // Load daily puzzle
      const puzzleRes = await fetch('/api/puzzles/daily');
      const puzzleData = await puzzleRes.json();
      if (!puzzleData.alreadyAttempted && puzzleData.puzzle) {
        setDailyPuzzle(puzzleData.puzzle);
      }
      status['daily_puzzle'] = puzzleData.alreadyAttempted || false;
      setGameStatus(status);

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

  async function handleGameComplete(gameId?: string, gameType?: string) {
    // Mark game as complete via API
    if (gameId && gameType) {
      try {
        await fetch(`/api/games/${gameType}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId })
        });
      } catch (error) {
        console.error('Error completing game:', error);
      }
    }

    // Reload dashboard data
    loadDashboard();
    setActiveGame(null);
  }

  function handlePuzzleComplete(result: { insight: string; points: number }) {
    // Show success message or handle puzzle result
    console.log('Puzzle completed:', result);

    // Reload dashboard
    loadDashboard();
    setActiveGame(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const wouldYouRatherGame = dailyGames.find(g => g.game_type === 'would_you_rather');
  const thisOrThatGame = dailyGames.find(g => g.game_type === 'this_or_that');
  const redFlagGame = dailyGames.find(g => g.game_type === 'red_flag_green_flag');
  const finishSentenceGame = dailyGames.find(g => g.game_type === 'finish_sentence');

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold text-navy">
            IntroAlignment
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-navy hover:text-navy transition">
              Matches
            </Link>
            <Link href="/dashboard-interactive" className="text-navy font-semibold">
              Daily Activities
            </Link>
            <Link href="/dashboard/profile" className="text-navy hover:text-navy transition">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-navy hover:text-navy transition"
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
          <h2 className="font-serif text-3xl text-navy mb-6">Today's Activities</h2>

          {/* Active Game Display */}
          {activeGame === 'would_you_rather' && wouldYouRatherGame ? (
            <WouldYouRatherGame
              game={wouldYouRatherGame}
              userId={user.id}
              onComplete={() => handleGameComplete(wouldYouRatherGame.id, 'would_you_rather')}
              onClose={() => setActiveGame(null)}
            />
          ) : activeGame === 'this_or_that' && thisOrThatGame ? (
            <ThisOrThatGame
              game={thisOrThatGame}
              userId={user.id}
              onComplete={() => handleGameComplete(thisOrThatGame.id, 'this_or_that')}
              onClose={() => setActiveGame(null)}
            />
          ) : activeGame === 'red_flag_green_flag' && redFlagGame ? (
            <RedFlagGreenFlagGame
              game={redFlagGame}
              userId={user.id}
              onComplete={() => handleGameComplete(redFlagGame.id, 'red_flag_green_flag')}
              onClose={() => setActiveGame(null)}
            />
          ) : activeGame === 'finish_sentence' && finishSentenceGame ? (
            <FinishSentenceGame
              game={finishSentenceGame}
              userId={user.id}
              onComplete={() => handleGameComplete(finishSentenceGame.id, 'finish_sentence')}
              onClose={() => setActiveGame(null)}
            />
          ) : activeGame === 'daily_puzzle' && dailyPuzzle ? (
            <DailyPuzzleGame
              puzzle={dailyPuzzle}
              userId={user.id}
              onComplete={handlePuzzleComplete}
              onClose={() => setActiveGame(null)}
            />
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Would You Rather Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gold-light bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤔</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-navy">Would You Rather</h3>
                    <p className="text-sm text-navy-light">10 questions • 10 pts</p>
                  </div>
                </div>
                <p className="text-navy-light mb-4">
                  Fun scenarios that reveal your priorities and values
                </p>
                {gameStatus['would_you_rather'] ? (
                  <div className="py-3 px-6 bg-sage bg-opacity-20 text-sage rounded-full text-center font-medium border-2 border-sage">
                    ✓ Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGame('would_you_rather')}
                    className="w-full py-3 px-6 bg-gold text-white rounded-full hover:bg-gold/90 transition font-semibold"
                  >
                    Play Now
                  </button>
                )}
              </div>

              {/* This or That Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blush bg-opacity-30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-navy">This or That</h3>
                    <p className="text-sm text-gray-600">10 questions • {thisOrThatGame?.points_value || 5} pts</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Quick choices that reveal your preferences
                </p>
                {gameStatus['this_or_that'] ? (
                  <div className="py-3 px-6 bg-sage bg-opacity-20 text-sage rounded-full text-center font-medium border-2 border-sage">
                    ✓ Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGame('this_or_that')}
                    className="w-full py-3 px-6 bg-gold text-white rounded-full hover:bg-gold/90 transition font-semibold"
                  >
                    Play Now
                  </button>
                )}
              </div>

              {/* Red Flag Green Flag Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🚩</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-navy">Red or Green Flag?</h3>
                    <p className="text-sm text-gray-600">10 scenarios • {redFlagGame?.points_value || 10} pts</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Judge dating scenarios to reveal your boundaries
                </p>
                {gameStatus['red_flag_green_flag'] ? (
                  <div className="py-3 px-6 bg-sage bg-opacity-20 text-sage rounded-full text-center font-medium border-2 border-sage">
                    ✓ Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGame('red_flag_green_flag')}
                    className="w-full py-3 px-6 bg-gold text-white rounded-full hover:bg-gold/90 transition font-semibold"
                  >
                    Play Now
                  </button>
                )}
              </div>

              {/* Finish the Sentence Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-navy">Finish the Sentence</h3>
                    <p className="text-sm text-gray-600">10 prompts • {finishSentenceGame?.points_value || 15} pts</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Complete prompts to reveal your values and style
                </p>
                {gameStatus['finish_sentence'] ? (
                  <div className="py-3 px-6 bg-sage bg-opacity-20 text-sage rounded-full text-center font-medium border-2 border-sage">
                    ✓ Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGame('finish_sentence')}
                    className="w-full py-3 px-6 bg-gold text-white rounded-full hover:bg-gold/90 transition font-semibold"
                  >
                    Play Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Activities */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Puzzle */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧩</span>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-navy">Daily Puzzle</h3>
                <p className="text-sm text-gray-600">{dailyPuzzle?.points_value || 20} pts</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Challenge yourself with today's scenario puzzle
            </p>
            {gameStatus['daily_puzzle'] ? (
              <div className="text-center py-4">
                <div className="py-3 px-6 bg-sage bg-opacity-20 text-sage rounded-full inline-block font-medium border-2 border-sage">
                  ✓ Completed Today
                </div>
                <p className="text-sm text-gray-500 mt-2">New puzzle tomorrow!</p>
              </div>
            ) : (
              <button
                onClick={() => setActiveGame('daily_puzzle')}
                className="w-full py-3 px-6 bg-gold text-white rounded-full hover:bg-gold/90 transition font-semibold"
              >
                Solve Puzzle
              </button>
            )}
          </div>

          {/* Community */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-serif text-2xl text-navy mb-4">Community</h3>
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-navy-light mb-4">Join discussions and polls!</p>
              <button
                disabled
                className="py-3 px-6 bg-navy-light text-white rounded-full opacity-50 cursor-not-allowed font-medium"
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Loading...</p>
        </div>
      </div>
    }>
      <DashboardInteractiveContent />
    </Suspense>
  );
}
