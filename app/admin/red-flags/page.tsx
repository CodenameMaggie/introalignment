'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RedFlag {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  evidence: string;
  status: 'new' | 'reviewing' | 'resolved' | 'dismissed';
  detected_at: string;
  reviewed_by_name?: string;
  resolution_notes?: string;
}

export default function RedFlagsPage() {
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadFlags();
  }, [filterStatus, filterSeverity]);

  async function loadFlags() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity !== 'all') params.set('severity', filterSeverity);

      const response = await fetch(`/api/admin/red-flags?${params}`);
      const data = await response.json();
      setFlags(data.flags || []);
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateFlagStatus(flagId: string, newStatus: string, notes?: string) {
    try {
      const response = await fetch('/api/admin/red-flags/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagId,
          status: newStatus,
          resolutionNotes: notes
        })
      });

      if (response.ok) {
        loadFlags();
      }
    } catch (error) {
      console.error('Error updating flag:', error);
      alert('Failed to update flag');
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-gray-400 text-white';
      default: return 'bg-gray-300';
    }
  };

  const getFlagTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      married: 'Married/In Relationship',
      dark_triad: 'Dark Triad Traits',
      safety: 'Safety Concern',
      inconsistency: 'Profile Inconsistency',
      user_report: 'User Report'
    };
    return labels[type] || type;
  };

  const criticalFlags = flags.filter(f => f.severity === 'critical');
  const highFlags = flags.filter(f => f.severity === 'high');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header with Alert */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl text-navy mb-2">Red Flag Alerts</h1>
            <p className="text-gray-600">Safety and quality monitoring</p>
          </div>
          {criticalFlags.length > 0 && (
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg animate-pulse">
              <div className="font-bold text-lg">{criticalFlags.length} Critical</div>
              <div className="text-sm">Immediate attention required</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-600">{criticalFlags.length}</div>
          <div className="text-sm text-gray-600">Critical Flags</div>
        </div>
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4">
          <div className="text-3xl font-bold text-orange-600">{highFlags.length}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-navy">
            {flags.filter(f => f.status === 'new').length}
          </div>
          <div className="text-sm text-gray-600">Needs Review</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-600">
            {flags.filter(f => f.status === 'resolved').length}
          </div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold outline-none"
            >
              <option value="active">Active (New + Reviewing)</option>
              <option value="new">New Only</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All Flags</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flags Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {flags.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-semibold text-navy mb-2">No flags to review</p>
            <p className="text-gray-600">All clear! Platform safety is looking good.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Evidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Detected
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.map((flag) => (
                <tr
                  key={flag.id}
                  className={`hover:bg-gray-50 ${
                    flag.severity === 'critical' ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(flag.severity)}`}>
                      {flag.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/users/${flag.user_id}`} className="hover:text-gold">
                      <div className="font-medium text-navy">{flag.user_name}</div>
                      <div className="text-sm text-gray-500">{flag.user_email}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-navy">
                      {getFlagTypeLabel(flag.flag_type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{flag.source}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-md truncate">
                      {flag.evidence}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(flag.detected_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      flag.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      flag.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                      flag.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {flag.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {flag.status === 'new' && (
                        <button
                          onClick={() => updateFlagStatus(flag.id, 'reviewing')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Review
                        </button>
                      )}
                      {(flag.status === 'new' || flag.status === 'reviewing') && (
                        <>
                          <button
                            onClick={() => {
                              const notes = prompt('Resolution notes:');
                              if (notes) updateFlagStatus(flag.id, 'resolved', notes);
                            }}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Reason for dismissal:');
                              if (notes) updateFlagStatus(flag.id, 'dismissed', notes);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
