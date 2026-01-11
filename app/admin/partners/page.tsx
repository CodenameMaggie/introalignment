'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Partner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  professional_title: string;
  firm_name: string | null;
  years_experience: number;
  specializations: string[];
  licensed_states: string[];
  partner_type: string;
  partnership_tier: string;
  status: string;
  podcast_interest: boolean;
  podcast_status: string;
  initial_contact_date: string;
  last_contact_date: string | null;
  created_at: string;
}

export default function PartnersAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPartnerType, setFilterPartnerType] = useState<string>('all');
  const [filterPodcast, setFilterPodcast] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners');
      const data = await response.json();
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/partners/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId, status: newStatus })
      });
      fetchPartners();
    } catch (error) {
      console.error('Error updating partner:', error);
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;
    const matchesType = filterPartnerType === 'all' || partner.partner_type === filterPartnerType;
    const matchesPodcast = filterPodcast === 'all' ||
      (filterPodcast === 'interested' && partner.podcast_interest) ||
      (filterPodcast === 'not_interested' && !partner.podcast_interest);
    const matchesSearch = searchQuery === '' ||
      partner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.professional_title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesPodcast && matchesSearch;
  });

  const stats = {
    total: partners.length,
    pending: partners.filter(p => p.status === 'pending').length,
    approved: partners.filter(p => p.status === 'approved').length,
    active: partners.filter(p => p.partner_type === 'active').length,
    podcast_interested: partners.filter(p => p.podcast_interest).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-heading text-2xl text-charcoal">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-obsidian text-cream py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/admin" className="font-heading text-2xl font-bold text-gold">
            IntroAlignment Admin
          </Link>
          <div className="flex gap-6 font-ui">
            <Link href="/admin" className="hover:text-gold transition-colors">Dashboard</Link>
            <Link href="/admin/leads" className="hover:text-gold transition-colors">Leads</Link>
            <Link href="/admin/partners" className="text-gold">Partners</Link>
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-obsidian mb-2">
            Partnership Management
          </h1>
          <p className="font-body text-charcoal text-lg">
            Manage lawyer partnerships and podcast guest applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-luxury border-t-4 border-gold">
            <div className="font-heading text-3xl font-bold text-obsidian mb-1">{stats.total}</div>
            <div className="font-ui text-sm text-charcoal">Total Partners</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-luxury border-t-4 border-gold">
            <div className="font-heading text-3xl font-bold text-obsidian mb-1">{stats.pending}</div>
            <div className="font-ui text-sm text-charcoal">Pending Review</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-luxury border-t-4 border-gold">
            <div className="font-heading text-3xl font-bold text-obsidian mb-1">{stats.approved}</div>
            <div className="font-ui text-sm text-charcoal">Approved</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-luxury border-t-4 border-gold">
            <div className="font-heading text-3xl font-bold text-obsidian mb-1">{stats.active}</div>
            <div className="font-ui text-sm text-charcoal">Active Partners</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-luxury border-t-4 border-gold">
            <div className="font-heading text-3xl font-bold text-obsidian mb-1">{stats.podcast_interested}</div>
            <div className="font-ui text-sm text-charcoal">Podcast Interest</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-luxury mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block font-ui font-medium text-charcoal mb-2 text-sm">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, title..."
                className="w-full px-4 py-2 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
              />
            </div>
            <div>
              <label className="block font-ui font-medium text-charcoal mb-2 text-sm">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block font-ui font-medium text-charcoal mb-2 text-sm">Partner Type</label>
              <select
                value={filterPartnerType}
                onChange={(e) => setFilterPartnerType(e.target.value)}
                className="w-full px-4 py-2 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
              >
                <option value="all">All Types</option>
                <option value="prospect">Prospect</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block font-ui font-medium text-charcoal mb-2 text-sm">Podcast</label>
              <select
                value={filterPodcast}
                onChange={(e) => setFilterPodcast(e.target.value)}
                className="w-full px-4 py-2 border border-soft-gray rounded-lg font-body focus:outline-none focus:border-gold text-obsidian"
              >
                <option value="all">All</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white rounded-lg shadow-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-obsidian text-cream">
                <tr>
                  <th className="px-6 py-4 text-left font-ui text-sm">Name</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Title</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Specializations</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Experience</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Podcast</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Status</th>
                  <th className="px-6 py-4 text-left font-ui text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center font-body text-charcoal">
                      No partners found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-cream transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-heading font-semibold text-obsidian">{partner.full_name}</div>
                        <div className="font-body text-sm text-charcoal">{partner.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-body text-obsidian">{partner.professional_title}</div>
                        {partner.firm_name && (
                          <div className="font-body text-sm text-charcoal">{partner.firm_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {partner.specializations.slice(0, 2).map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gold/20 text-obsidian font-ui text-xs rounded"
                            >
                              {spec}
                            </span>
                          ))}
                          {partner.specializations.length > 2 && (
                            <span className="px-2 py-1 bg-soft-gray text-obsidian font-ui text-xs rounded">
                              +{partner.specializations.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body text-obsidian">
                        {partner.years_experience} years
                      </td>
                      <td className="px-6 py-4">
                        {partner.podcast_interest ? (
                          <span className="px-3 py-1 bg-sage/20 text-sage-dark font-ui text-xs rounded-full">
                            Interested
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-soft-gray text-charcoal font-ui text-xs rounded-full">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={partner.status}
                          onChange={(e) => updatePartnerStatus(partner.id, e.target.value)}
                          className="px-3 py-1 border border-soft-gray rounded font-ui text-sm text-obsidian focus:outline-none focus:border-gold"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/partners/${partner.id}`}
                          className="text-gold hover:text-gold-dark font-ui text-sm underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link
            href="/partners"
            className="bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-6 py-4 rounded-lg transition-all shadow-luxury text-center"
          >
            View Partner Application Form
          </Link>
          <button
            onClick={() => window.location.href = '/admin/partners/outreach'}
            className="bg-charcoal hover:bg-charcoal-light text-cream font-ui font-semibold px-6 py-4 rounded-lg transition-all shadow-luxury"
          >
            Launch Outreach Campaign
          </button>
          <button
            onClick={() => window.location.href = '/admin/partners/podcast'}
            className="bg-sage hover:bg-sage-light text-cream font-ui font-semibold px-6 py-4 rounded-lg transition-all shadow-luxury"
          >
            Manage Podcast Episodes
          </button>
        </div>
      </div>
    </div>
  );
}
