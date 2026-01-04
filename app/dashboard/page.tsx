'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Match {
  id: string;
  overall_score: number;
  status: string;
  introduced_at: string;
  partner_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const showWelcome = searchParams.get('welcome') === 'true';

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

      // Load user profile and matches
      // TODO: Implement these API endpoints
      setLoading(false);
    } catch {
      router.push('/login');
    }
  }

  function handleLogout() {
    localStorage.removeItem('session');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"></div>
          <p className="text-charcoal">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Navigation */}
      <nav className="bg-white border-b border-ivory-dark">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold text-burgundy">
            IntroAlignment
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-charcoal hover:text-burgundy transition">
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className="text-charcoal hover:text-burgundy transition">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-charcoal hover:text-burgundy transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Welcome Message */}
        {showWelcome && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-copper">
            <h2 className="font-serif text-2xl text-burgundy mb-3">
              Welcome to IntroAlignment! 🎉
            </h2>
            <p className="text-charcoal-light mb-4">
              Thank you for sharing your story with us. We're now getting to know you deeply and
              looking for someone who's truly aligned with your life and values.
            </p>
            <p className="text-charcoal-light">
              We'll notify you when we find a potential match. In the meantime, feel free to explore
              your profile and update any information.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Status */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="font-serif text-2xl text-burgundy mb-6">Your Profile</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-ivory-dark">
                  <span className="text-charcoal">Profile Completeness</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-ivory-dark rounded-full h-2">
                      <div className="bg-burgundy rounded-full h-2 w-full"></div>
                    </div>
                    <span className="text-burgundy font-semibold">100%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-ivory-dark">
                  <span className="text-charcoal">Status</span>
                  <span className="px-3 py-1 bg-copper-light text-white rounded-full text-sm font-medium">
                    Looking for Matches
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-charcoal">Member Since</span>
                  <span className="text-charcoal-light">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/profile"
                className="mt-6 block text-center py-3 px-6 border-2 border-burgundy text-burgundy rounded-full hover:bg-burgundy hover:text-white transition font-medium"
              >
                View Full Profile
              </Link>
            </div>

            {/* Matches Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="font-serif text-2xl text-burgundy mb-6">Your Matches</h2>

              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-dusty-rose-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl text-burgundy mb-2">We're Looking</h3>
                  <p className="text-charcoal-light max-w-md mx-auto">
                    We're carefully reviewing potential matches for you. When we find someone
                    who's truly aligned with your values and vision, we'll introduce you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="border-2 border-ivory-dark rounded-xl p-6 hover:border-copper transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-serif text-lg text-burgundy">{match.partner_name}</h3>
                          <p className="text-sm text-charcoal-light">
                            {match.overall_score}% Compatible
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-dusty-rose-light text-burgundy rounded-full text-sm">
                          New
                        </span>
                      </div>
                      <button className="w-full py-2 bg-burgundy text-white rounded-lg hover:bg-burgundy-light transition">
                        View Introduction
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-serif text-lg text-burgundy mb-4">What's Next?</h3>
              <ul className="space-y-3 text-sm text-charcoal-light">
                <li className="flex items-start gap-2">
                  <span className="text-copper">✓</span>
                  <span>Profile complete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-burgundy">→</span>
                  <span>We're reviewing potential matches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-charcoal">·</span>
                  <span>You'll receive an email when we find someone</span>
                </li>
              </ul>
            </div>

            <div className="bg-burgundy rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-serif text-lg mb-3">Need Help?</h3>
              <p className="text-sm text-dusty-rose-light mb-4">
                Have questions about the matching process or want to update your preferences?
              </p>
              <a
                href="mailto:support@introalignment.com"
                className="block text-center py-2 px-4 bg-white text-burgundy rounded-lg hover:bg-ivory transition text-sm font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
