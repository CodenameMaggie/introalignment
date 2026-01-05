'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardMetrics {
  totalUsers: number;
  usersWithCompleteProfiles: number;
  subscriptions: {
    free: number;
    seeker: number;
    aligned: number;
    founder: number;
  };
  revenueThisMonth: number;
  matchesThisWeek: number;
  introductionsThisWeek: number;
  activeRedFlags: number;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const response = await fetch('/api/admin/dashboard-metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard metrics</p>
      </div>
    );
  }

  const MetricCard = ({ label, value, icon, color = 'navy', alert = false }: any) => (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${alert ? 'border-red-500' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      </div>
      <div className={`text-4xl font-bold mb-1 text-${color}`}>{value.toLocaleString()}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-navy mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Platform metrics and health at a glance</p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Total Users"
          value={metrics.totalUsers}
          icon="👥"
          color="navy"
        />
        <MetricCard
          label="Complete Profiles"
          value={metrics.usersWithCompleteProfiles}
          icon="✓"
          color="green-600"
        />
        <MetricCard
          label="Revenue This Month"
          value={`$${metrics.revenueThisMonth}`}
          icon="💰"
          color="gold"
        />
        <MetricCard
          label="Active Red Flags"
          value={metrics.activeRedFlags}
          icon="🚩"
          color="red-600"
          alert={metrics.activeRedFlags > 0}
        />
      </div>

      {/* Subscriptions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="font-serif text-2xl text-navy mb-6">Subscriptions by Plan</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-400 mb-2">
              {metrics.subscriptions.free}
            </div>
            <div className="text-sm text-gray-600">Free</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.subscriptions.seeker}
            </div>
            <div className="text-sm text-gray-600">Seeker ($49/mo)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold mb-2">
              {metrics.subscriptions.aligned}
            </div>
            <div className="text-sm text-gray-600">Aligned ($99/mo)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-navy mb-2">
              {metrics.subscriptions.founder}
            </div>
            <div className="text-sm text-gray-600">Founder ($199/mo)</div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💕</span>
            <div>
              <h3 className="font-semibold text-navy">Matches This Week</h3>
              <p className="text-sm text-gray-600">New compatible pairs</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-gold">{metrics.matchesThisWeek}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📧</span>
            <div>
              <h3 className="font-semibold text-navy">Introductions This Week</h3>
              <p className="text-sm text-gray-600">Matches shown to users</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-navy">{metrics.introductionsThisWeek}</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-serif text-2xl text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="p-4 bg-cream hover:bg-blush-light rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-navy">Manage Users</div>
          </Link>
          <Link
            href="/admin/red-flags"
            className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">🚩</div>
            <div className="font-medium text-navy">Review Flags</div>
          </Link>
          <Link
            href="/admin/matches"
            className="p-4 bg-cream hover:bg-blush-light rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">💕</div>
            <div className="font-medium text-navy">View Matches</div>
          </Link>
          <Link
            href="/admin/revenue"
            className="p-4 bg-cream hover:bg-blush-light rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium text-navy">Revenue</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
