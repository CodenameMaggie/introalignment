'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    age: number;
    location: string;
    gender: string;
  };
  scores: {
    overall: number;
    psychological: number;
    intellectual: number;
    communication: number;
    lifeAlignment: number;
    astrological: number;
  };
  status: string;
  myResponse: string | null;
  theirResponse: string | null;
  hasReport: boolean;
  reportSummary: string;
  createdAt: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'connected'>('all');

  useEffect(() => {
    fetchMatches();
  }, [filter]);

  async function fetchMatches() {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/matches'
        : `/api/matches?status=${filter}`;

      const res = await fetch(url);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(match: Match) {
    if (match.status === 'connected') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold text-white">
          Connected
        </span>
      );
    }

    if (match.myResponse === 'interested' && !match.theirResponse) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blush text-navy">
          Waiting for response
        </span>
      );
    }

    if (!match.myResponse) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-navy text-white">
          New
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
        {match.status}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-navy/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-serif text-4xl text-navy mb-2">Your Matches</h1>
          <p className="text-gray-600">
            These are people we think you'd truly align with
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              filter === 'all'
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-navy/20 hover:border-navy'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              filter === 'pending'
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-navy/20 hover:border-navy'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('connected')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              filter === 'connected'
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-navy/20 hover:border-navy'
            }`}
          >
            Connected
          </button>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="font-serif text-2xl text-navy mb-4">No matches yet</p>
            <p className="text-gray-600">
              We're working on finding your perfect match. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all border border-transparent hover:border-gold"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif text-2xl text-navy mb-1">
                      {match.otherUser.firstName}
                    </h3>
                    <p className="text-gray-600">
                      {match.otherUser.age} • {match.otherUser.location}
                    </p>
                  </div>
                  {getStatusBadge(match)}
                </div>

                {/* Compatibility Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Overall Compatibility
                    </span>
                    <span className="text-2xl font-bold text-gold">
                      {match.scores.overall}%
                    </span>
                  </div>
                  <div className="h-2 bg-blush-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all"
                      style={{ width: `${match.scores.overall}%` }}
                    />
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-navy">
                      {match.scores.psychological}%
                    </div>
                    <div className="text-xs text-gray-500">Psychological</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-navy">
                      {match.scores.intellectual}%
                    </div>
                    <div className="text-xs text-gray-500">Intellectual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-navy">
                      {match.scores.lifeAlignment}%
                    </div>
                    <div className="text-xs text-gray-500">Life Goals</div>
                  </div>
                </div>

                {/* Summary */}
                {match.hasReport && match.reportSummary && (
                  <p className="text-sm text-gray-600 line-clamp-3 italic">
                    "{match.reportSummary.substring(0, 150)}..."
                  </p>
                )}

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gold font-medium text-sm hover:text-gold-dark">
                    View full introduction →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
