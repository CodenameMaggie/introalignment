'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface MatchDetail {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    age: number;
    gender: string;
    location: {
      city: string;
      country: string;
    };
    hasChildren: boolean;
    wantsChildren: string;
  };
  scores: {
    overall: number;
    psychological: number;
    intellectual: number;
    communication: number;
    lifeAlignment: number;
    astrological: number;
  };
  scoreDetails: any;
  status: string;
  myResponse: string | null;
  theirResponse: string | null;
  report: {
    executiveSummary: string;
    compatibilityNarrative: string;
    growthOpportunities: string;
    conversationStarters: Array<{
      topic: string;
      why: string;
    }>;
    potentialChallenges: string;
    astrologicalInsights: string;
  } | null;
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  async function fetchMatch() {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error('Failed to fetch match');
      const data = await res.json();
      setMatch(data.match);
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  }

  async function respondToMatch(response: 'interested' | 'not_interested' | 'maybe') {
    setResponding(true);
    try {
      const res = await fetch('/api/matches/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, response })
      });

      const data = await res.json();

      if (data.mutualMatch) {
        alert("It's a match! You can now message each other.");
        router.push(`/messages/${matchId}`);
      } else {
        alert('Response recorded. Waiting for their response.');
        fetchMatch(); // Refresh the match data
      }
    } catch (error) {
      console.error('Error responding to match:', error);
      alert('Failed to respond. Please try again.');
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-navy mb-4">Match not found</h1>
          <Link href="/matches" className="text-gold hover:text-gold-dark">
            ← Back to matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-navy/10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/matches" className="text-gold hover:text-gold-dark mb-4 inline-block">
            ← Back to matches
          </Link>
          <h1 className="font-serif text-4xl text-navy mb-2">
            Meet {match.otherUser.firstName}
          </h1>
          <p className="text-gray-600">
            {match.otherUser.age} • {match.otherUser.location.city}, {match.otherUser.location.country}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Compatibility Score Card */}
        <div className="bg-gradient-to-br from-gold/10 to-blush-light rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-gold mb-2">
              {match.scores.overall}%
            </div>
            <div className="font-serif text-2xl text-navy">Overall Compatibility</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Psychological', value: match.scores.psychological },
              { label: 'Intellectual', value: match.scores.intellectual },
              { label: 'Communication', value: match.scores.communication },
              { label: 'Life Goals', value: match.scores.lifeAlignment },
              { label: 'Astrological', value: match.scores.astrological }
            ].map((score) => (
              <div key={score.label} className="text-center">
                <div className="text-2xl font-bold text-navy">{score.value}%</div>
                <div className="text-sm text-gray-600">{score.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Actions */}
        {!match.myResponse && (
          <div className="bg-white rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl text-navy mb-4">Interested?</h2>
            <p className="text-gray-600 mb-6">
              Let us know if you'd like to connect with {match.otherUser.firstName}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => respondToMatch('interested')}
                disabled={responding}
                className="flex-1 px-6 py-3 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-all disabled:opacity-50"
              >
                {responding ? 'Responding...' : "Yes, I'm interested"}
              </button>
              <button
                onClick={() => respondToMatch('maybe')}
                disabled={responding}
                className="flex-1 px-6 py-3 bg-blush text-navy rounded-full font-semibold hover:bg-blush-dark transition-all disabled:opacity-50"
              >
                Maybe
              </button>
              <button
                onClick={() => respondToMatch('not_interested')}
                disabled={responding}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Not right now
              </button>
            </div>
          </div>
        )}

        {/* Status if already responded */}
        {match.myResponse && (
          <div className="bg-blush-light rounded-2xl p-6 mb-8">
            <p className="text-navy font-medium">
              {match.myResponse === 'interested' && !match.theirResponse &&
                "You're interested! Waiting for their response..."}
              {match.myResponse === 'interested' && match.theirResponse === 'interested' &&
                "It's a match! You can now message each other."}
              {match.myResponse === 'not_interested' &&
                "You've declined this match."}
              {match.myResponse === 'maybe' && !match.theirResponse &&
                "You marked this as maybe. Waiting for their response..."}
            </p>
            {match.status === 'connected' && (
              <Link
                href={`/messages/${matchId}`}
                className="inline-block mt-4 px-6 py-3 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-all"
              >
                Send a message →
              </Link>
            )}
          </div>
        )}

        {/* Introduction Report */}
        {match.report && (
          <div className="space-y-8">
            {/* Executive Summary */}
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-serif text-3xl text-navy mb-4">Why You're a Great Match</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {match.report.executiveSummary}
              </p>
            </div>

            {/* Compatibility Narrative */}
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-serif text-2xl text-navy mb-4">Compatibility Deep Dive</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {match.report.compatibilityNarrative}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="bg-blush-light rounded-2xl p-8">
              <h2 className="font-serif text-2xl text-navy mb-4">Conversation Starters</h2>
              <div className="space-y-4">
                {match.report.conversationStarters.map((starter, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4">
                    <h3 className="font-semibold text-navy mb-2">{starter.topic}</h3>
                    <p className="text-gray-600 text-sm">{starter.why}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Opportunities */}
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-serif text-2xl text-navy mb-4">How You Can Grow Together</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {match.report.growthOpportunities}
              </p>
            </div>

            {/* Potential Challenges */}
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-serif text-2xl text-navy mb-4">Things to Be Aware Of</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {match.report.potentialChallenges}
              </p>
            </div>

            {/* Astrological Insights */}
            {match.report.astrologicalInsights &&
             !match.report.astrologicalInsights.includes('not yet available') && (
              <div className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-8 text-white">
                <h2 className="font-serif text-2xl mb-4">Astrological Insights</h2>
                <p className="leading-relaxed whitespace-pre-line opacity-90">
                  {match.report.astrologicalInsights}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
