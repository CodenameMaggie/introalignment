'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Partner {
  id: string;
  full_name: string;
  email: string;
  source: string;
  status: string;
  podcast_status: string;
  licensed_states: string[];
  specializations: string[];
  created_at: string;
}

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check if user is logged in
    const session = localStorage.getItem('session');
    if (!session) {
      router.push('/login');
      return;
    }

    loadPartners();
  }, [filter]);

  async function loadPartners() {
    try {
      const response = await fetch(`https://cxiazrciueruvvsxaxcz.supabase.co/rest/v1/partners?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDI4NjcsImV4cCI6MjA4MzExODg2N30.YJyX3TxA8vyk1V5toGsxtl_LJTxA_Vgxf4uJRJbDPEA',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDI4NjcsImV4cCI6MjA4MzExODg2N30.YJyX3TxA8vyk1V5toGsxtl_LJTxA_Vgxf4uJRJbDPEA'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('session');
    router.push('/');
  }

  const filteredPartners = partners.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'mfs') return p.source?.includes('_osm') || p.source?.includes('_youtube');
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'active') return p.status === 'active';
    return true;
  });

  const stats = {
    total: partners.length,
    mfs: partners.filter(p => p.source?.includes('_osm') || p.source?.includes('_youtube')).length,
    pending: partners.filter(p => p.status === 'pending').length,
    active: partners.filter(p => p.status === 'active').length,
    placeholder: partners.filter(p => p.email?.includes('pending.')).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin-partners" className="font-serif text-2xl font-semibold text-navy">
            IntroAlignment Admin
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin-partners" className="text-navy hover:text-gold transition">
              Partners
            </Link>
            <button
              onClick={handleLogout}
              className="text-navy hover:text-gold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-navy mb-2">Estate Planning Attorneys</h1>
          <p className="text-navy-light">Manage attorney partners from MFS and direct applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-navy">{stats.total}</div>
            <div className="text-sm text-navy-light">Total Partners</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-gold">{stats.mfs}</div>
            <div className="text-sm text-navy-light">From MFS</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-navy-light">Pending</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-navy-light">Active</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-red-600">{stats.placeholder}</div>
            <div className="text-sm text-navy-light">No Email</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-navy text-white' : 'bg-cream text-navy'}`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('mfs')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'mfs' ? 'bg-navy text-white' : 'bg-cream text-navy'}`}
          >
            From MFS ({stats.mfs})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'pending' ? 'bg-navy text-white' : 'bg-cream text-navy'}`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'active' ? 'bg-navy text-white' : 'bg-cream text-navy'}`}
          >
            Active ({stats.active})
          </button>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">States</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Podcast</th>
                <th className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-navy-light">
                    No partners found
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-cream transition">
                    <td className="px-4 py-3 font-medium text-navy">
                      {partner.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {partner.email?.includes('pending.') ? (
                        <span className="text-red-600">No Email</span>
                      ) : (
                        <a href={`mailto:${partner.email}`} className="text-navy hover:text-gold">
                          {partner.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-light">
                      {partner.licensed_states?.join(', ') || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        partner.source?.includes('_osm') || partner.source?.includes('_youtube')
                          ? 'bg-gold text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {partner.source || 'Direct'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        partner.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : partner.status === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-light">
                      {partner.podcast_status || 'not_contacted'}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-light">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-navy mb-2">⚠️ Email Status</h3>
          <p className="text-sm text-navy-light">
            {stats.placeholder} partners have placeholder emails (pending.*@introalignment.com).
            Once real email addresses are added to the MFS database, the automated sync will update them
            and podcast outreach will begin automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
