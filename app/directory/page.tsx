'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Attorney {
  id: string;
  full_name: string;
  slug: string;
  professional_title: string;
  firm_name: string;
  licensed_states: string[];
  specializations: string[];
  years_experience: number;
  city: string;
  state: string;
  bio: string;
  is_premium: boolean;
  is_verified: boolean;
}

export default function DirectoryPage() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    fetchAttorneys();
  }, []);

  async function fetchAttorneys() {
    try {
      const res = await fetch('/api/directory');
      const data = await res.json();
      setAttorneys(data.attorneys || []);
    } catch (error) {
      console.error('Error fetching attorneys:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAttorneys = attorneys.filter(attorney => {
    const matchesSearch = !searchQuery ||
      attorney.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attorney.firm_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attorney.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesState = !selectedState || attorney.licensed_states?.includes(selectedState);
    const matchesSpecialization = !selectedSpecialization || attorney.specializations?.includes(selectedSpecialization);

    return matchesSearch && matchesState && matchesSpecialization;
  });

  // Sort: Premium first, then verified, then alphabetical
  const sortedAttorneys = [...filteredAttorneys].sort((a, b) => {
    if (a.is_premium && !b.is_premium) return -1;
    if (!a.is_premium && b.is_premium) return 1;
    if (a.is_verified && !b.is_verified) return -1;
    if (!a.is_verified && b.is_verified) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const allStates = [...new Set(attorneys.flatMap(a => a.licensed_states || []))].sort();
  const allSpecializations = [...new Set(attorneys.flatMap(a => a.specializations || []))].sort();

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 20px 0' }}>
          Estate Planning Attorney Directory
        </h1>
        <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Find verified estate planning attorneys specializing in dynasty trusts, asset protection, and wealth preservation
        </p>
        <p style={{ fontSize: '14px', marginTop: '20px', opacity: 0.8 }}>
          ✓ All attorneys verified by Jordan & Atlas AI systems
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{
        maxWidth: '1200px',
        margin: '-30px auto 40px auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Attorney name, firm, or specialty"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* State Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="">All States</option>
                {allStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Specialization Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="">All Specializations</option>
                {allSpecializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Showing {sortedAttorneys.length} of {attorneys.length} attorneys
          </div>
        </div>
      </div>

      {/* Attorney Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            Loading attorneys...
          </div>
        ) : sortedAttorneys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            No attorneys found matching your criteria.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            {sortedAttorneys.map(attorney => (
              <Link
                key={attorney.id}
                href={`/directory/${attorney.slug}`}
                style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '30px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: attorney.is_premium ? '3px solid #d4a574' : '1px solid #e5e7eb',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Premium Badge */}
                {attorney.is_premium && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    FEATURED
                  </div>
                )}

                {/* Verified Badge */}
                {attorney.is_verified && (
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      ✓ VERIFIED
                    </span>
                  </div>
                )}

                {/* Attorney Info */}
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
                  {attorney.full_name}
                </h3>

                <p style={{ color: '#667eea', fontWeight: '600', fontSize: '16px', margin: '5px 0' }}>
                  {attorney.professional_title}
                </p>

                {attorney.firm_name && (
                  <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                    {attorney.firm_name}
                  </p>
                )}

                {attorney.city && attorney.state && (
                  <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                    📍 {attorney.city}, {attorney.state}
                  </p>
                )}

                {attorney.years_experience && (
                  <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                    {attorney.years_experience}+ years experience
                  </p>
                )}

                {/* Specializations */}
                {attorney.specializations && attorney.specializations.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {attorney.specializations.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#f3f4f6',
                            color: '#667eea',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                      {attorney.specializations.length > 3 && (
                        <span style={{
                          color: '#666',
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}>
                          +{attorney.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio Preview */}
                {attorney.bio && (
                  <p style={{
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    marginTop: '15px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {attorney.bio}
                  </p>
                )}

                {/* View Profile Button */}
                <div style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: attorney.is_premium ? 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)' : '#667eea',
                  color: 'white',
                  borderRadius: '25px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  View Full Profile →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
