'use client';

import { useState, useEffect } from 'react';

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    minScore: '0'
  });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.source) params.set('source', filters.source);
      if (filters.minScore && parseInt(filters.minScore) > 0) {
        params.set('minScore', filters.minScore);
      }

      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runScraper() {
    if (!confirm('Run scraper now? This will fetch new leads from Reddit.')) return;

    try {
      const res = await fetch('/api/cron/scrape');
      const data = await res.json();
      alert(`Scraping complete!\n${JSON.stringify(data.results, null, 2)}`);
      fetchLeads();
    } catch (error) {
      alert('Scraper error: ' + error);
    }
  }

  async function scoreLeads() {
    if (!confirm('Score all unscored leads?')) return;

    try {
      const res = await fetch('/api/cron/score');
      const data = await res.json();
      alert(`Scored ${data.scored} leads`);
      fetchLeads();
    } catch (error) {
      alert('Scoring error: ' + error);
    }
  }

  const stats = {
    total: leads.length,
    withEmail: leads.filter(l => l.email).length,
    highScore: leads.filter(l => l.fit_score >= 70).length,
    inSequence: leads.filter(l => l.outreach_status === 'in_sequence').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>

          <div className="flex gap-2">
            <button
              onClick={runScraper}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Run Scraper
            </button>
            <button
              onClick={scoreLeads}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Score Leads
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Leads" value={stats.total} />
          <StatCard label="With Email" value={stats.withEmail} />
          <StatCard label="High Score (70+)" value={stats.highScore} />
          <StatCard label="In Sequence" value={stats.inSequence} />
          <StatCard label="Converted" value={stats.converted} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="enriched">Enriched</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="converted">Converted</option>
            </select>

            <select
              value={filters.source}
              onChange={e => setFilters({ ...filters, source: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="">All Sources</option>
              <option value="reddit">Reddit</option>
              <option value="twitter">Twitter</option>
              <option value="forum">Forums</option>
            </select>

            <input
              type="number"
              placeholder="Min Score"
              value={filters.minScore}
              onChange={e => setFilters({ ...filters, minScore: e.target.value })}
              className="px-4 py-2 border rounded w-32"
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No leads found. Try running the scraper!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Source</th>
                  <th className="p-3 text-left text-sm font-semibold">Username</th>
                  <th className="p-3 text-left text-sm font-semibold">Email</th>
                  <th className="p-3 text-left text-sm font-semibold">Score</th>
                  <th className="p-3 text-left text-sm font-semibold">Status</th>
                  <th className="p-3 text-left text-sm font-semibold">Created</th>
                  <th className="p-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.source_type === 'reddit' ? 'bg-orange-100 text-orange-800' :
                        lead.source_type === 'twitter' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.source_type}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{lead.username}</td>
                    <td className="p-3 text-sm">{lead.email || '-'}</td>
                    <td className="p-3">
                      <span className={`font-semibold ${
                        lead.fit_score >= 70 ? 'text-green-600' :
                        lead.fit_score >= 50 ? 'text-yellow-600' :
                        lead.fit_score ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {lead.fit_score?.toFixed(0) || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{lead.status}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <a
                        href={lead.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
