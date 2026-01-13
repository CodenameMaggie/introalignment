'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RegionStats {
  region: string;
  attorney_count: number;
  podcast_engaged: number;
  practice_owners: number;
  avg_years_experience: number;
  states_covered: string[];
}

interface StateStats {
  state: string;
  attorney_count: number;
  podcast_engaged: number;
  practice_owners: number;
  multi_state_attorneys: number;
  avg_years_experience: number;
  region: string;
  high_net_worth_concentration: string;
  estate_planning_market: string;
}

interface MarketGap {
  state_code: string;
  state_name: string;
  region: string;
  hnw_concentration: string;
  attorney_count: number;
  gap_priority: string;
}

export default function GeographyAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'regions' | 'states' | 'gaps'>('regions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/geography?view=summary');
      const data = await response.json();
      if (data.success) {
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch geography data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal font-body">Loading geographic analytics...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal font-body">Failed to load data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-obsidian text-cream py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-heading text-2xl font-bold text-gold">
            IntroAlignment
          </Link>
          <div className="flex gap-6 font-ui">
            <Link href="/admin" className="hover:text-gold transition-colors">
              Admin Home
            </Link>
            <Link href="/admin/import-prospects" className="hover:text-gold transition-colors">
              Import Prospects
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <h1 className="font-heading text-4xl font-bold text-obsidian mb-2">
          Geographic Analytics
        </h1>
        <p className="font-body text-charcoal mb-8">
          State-by-state and regional distribution of estate planning attorneys
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gold font-heading text-3xl font-bold mb-2">
              {summary.summary.total_attorneys}
            </div>
            <div className="font-ui text-charcoal text-sm">Total Attorneys</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gold font-heading text-3xl font-bold mb-2">
              {summary.summary.regions_covered}
            </div>
            <div className="font-ui text-charcoal text-sm">Regions Covered</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gold font-heading text-3xl font-bold mb-2">
              {summary.summary.states_covered}
            </div>
            <div className="font-ui text-charcoal text-sm">States with Coverage</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-rose-600 font-heading text-3xl font-bold mb-2">
              {summary.summary.market_gaps}
            </div>
            <div className="font-ui text-charcoal text-sm">Market Gaps</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-soft-gray">
          <button
            onClick={() => setActiveTab('regions')}
            className={`font-ui px-6 py-3 -mb-px border-b-2 transition-colors ${
              activeTab === 'regions'
                ? 'border-gold text-gold font-semibold'
                : 'border-transparent text-charcoal hover:text-gold'
            }`}
          >
            By Region
          </button>
          <button
            onClick={() => setActiveTab('states')}
            className={`font-ui px-6 py-3 -mb-px border-b-2 transition-colors ${
              activeTab === 'states'
                ? 'border-gold text-gold font-semibold'
                : 'border-transparent text-charcoal hover:text-gold'
            }`}
          >
            By State
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`font-ui px-6 py-3 -mb-px border-b-2 transition-colors ${
              activeTab === 'gaps'
                ? 'border-gold text-gold font-semibold'
                : 'border-transparent text-charcoal hover:text-gold'
            }`}
          >
            Market Gaps
          </button>
        </div>

        {/* Content */}
        {activeTab === 'regions' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-charcoal text-cream">
                <tr>
                  <th className="px-6 py-3 text-left font-ui font-semibold">Region</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Attorneys</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Podcast Engaged</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Practice Owners</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Avg Experience</th>
                </tr>
              </thead>
              <tbody className="font-body text-charcoal">
                {summary.by_region.map((region: RegionStats, index: number) => (
                  <tr
                    key={region.region}
                    className={index % 2 === 0 ? 'bg-ivory' : 'bg-white'}
                  >
                    <td className="px-6 py-4 font-semibold">{region.region}</td>
                    <td className="px-6 py-4 text-right">{region.attorney_count}</td>
                    <td className="px-6 py-4 text-right">{region.podcast_engaged}</td>
                    <td className="px-6 py-4 text-right">{region.practice_owners}</td>
                    <td className="px-6 py-4 text-right">{region.avg_years_experience} years</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'states' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-charcoal text-cream">
                <tr>
                  <th className="px-6 py-3 text-left font-ui font-semibold">State</th>
                  <th className="px-6 py-3 text-left font-ui font-semibold">Region</th>
                  <th className="px-6 py-3 text-center font-ui font-semibold">HNW</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Attorneys</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Practice Owners</th>
                  <th className="px-6 py-3 text-right font-ui font-semibold">Multi-State</th>
                </tr>
              </thead>
              <tbody className="font-body text-charcoal">
                {summary.top_states.map((state: StateStats, index: number) => (
                  <tr
                    key={state.state}
                    className={index % 2 === 0 ? 'bg-ivory' : 'bg-white'}
                  >
                    <td className="px-6 py-4 font-semibold">{state.state}</td>
                    <td className="px-6 py-4">{state.region}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          state.high_net_worth_concentration === 'very_high'
                            ? 'bg-gold text-obsidian'
                            : state.high_net_worth_concentration === 'high'
                            ? 'bg-sage text-white'
                            : 'bg-soft-gray text-charcoal'
                        }`}
                      >
                        {state.high_net_worth_concentration?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{state.attorney_count}</td>
                    <td className="px-6 py-4 text-right">{state.practice_owners}</td>
                    <td className="px-6 py-4 text-right">{state.multi_state_attorneys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded">
              <h3 className="font-heading text-xl font-bold text-obsidian mb-2">
                Market Gaps Identified
              </h3>
              <p className="font-body text-charcoal">
                High-value markets with insufficient attorney coverage. These states represent opportunities for targeted recruitment.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-charcoal text-cream">
                  <tr>
                    <th className="px-6 py-3 text-left font-ui font-semibold">State</th>
                    <th className="px-6 py-3 text-left font-ui font-semibold">Region</th>
                    <th className="px-6 py-3 text-center font-ui font-semibold">HNW Concentration</th>
                    <th className="px-6 py-3 text-right font-ui font-semibold">Current Coverage</th>
                    <th className="px-6 py-3 text-center font-ui font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody className="font-body text-charcoal">
                  {summary.market_gaps.map((gap: MarketGap, index: number) => (
                    <tr
                      key={gap.state_code}
                      className={index % 2 === 0 ? 'bg-ivory' : 'bg-white'}
                    >
                      <td className="px-6 py-4 font-semibold">
                        {gap.state_name} ({gap.state_code})
                      </td>
                      <td className="px-6 py-4">{gap.region}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-gold text-obsidian rounded text-xs font-semibold">
                          {gap.hnw_concentration?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-rose-600 font-semibold">
                        {gap.attorney_count} attorneys
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            gap.gap_priority === 'CRITICAL_GAP'
                              ? 'bg-rose-600 text-white'
                              : gap.gap_priority === 'HIGH_GAP'
                              ? 'bg-orange-500 text-white'
                              : 'bg-yellow-500 text-obsidian'
                          }`}
                        >
                          {gap.gap_priority.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-ivory p-6 rounded-lg">
              <h4 className="font-heading text-lg font-bold text-obsidian mb-3">
                Recommended Actions
              </h4>
              <ul className="font-body text-charcoal space-y-2 list-disc ml-6">
                <li>
                  <strong>Critical Gap States:</strong> Prioritize attorney recruitment via LinkedIn Sales Navigator, state bar directories, ACTEC chapters
                </li>
                <li>
                  <strong>High Gap States:</strong> Target regional legal conferences and CLE events
                </li>
                <li>
                  <strong>Medium Gap States:</strong> Monitor organic applications and referrals
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-charcoal text-pearl py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-ui text-sm">
            © {new Date().getFullYear()} IntroAlignment - Geographic Analytics
          </p>
        </div>
      </footer>
    </div>
  );
}
