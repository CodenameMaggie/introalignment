'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  linkedin_url: string;
  website_url: string;
  email: string;
  phone: string;
  publications: string;
  speaking_engagements: string;
  is_premium: boolean;
  is_verified: boolean;
  bar_number: string;
}

export default function AttorneyProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [attorney, setAttorney] = useState<Attorney | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    if (slug) {
      fetchAttorney();
    }
  }, [slug]);

  async function fetchAttorney() {
    try {
      const res = await fetch(`/api/directory/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setAttorney(data.attorney);
      }
    } catch (error) {
      console.error('Error fetching attorney:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch(`/api/directory/${slug}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData)
      });
      alert('Your inquiry has been sent!');
      setShowInquiryForm(false);
      setInquiryData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      alert('Error sending inquiry. Please try again.');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#666' }}>Loading attorney profile...</p>
          <style dangerouslySetInnerHTML={{
            __html: `@keyframes spin { to { transform: rotate(360deg); } }`
          }} />
        </div>
      </div>
    );
  }

  if (!attorney) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>404</h1>
          <h2 style={{ fontSize: '24px', color: '#333', margin: '0 0 20px 0' }}>Attorney Not Found</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            The attorney profile you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/directory"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#667eea',
              color: 'white',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link
            href="/directory"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              opacity: 0.9,
              display: 'inline-block',
              marginBottom: '20px'
            }}
          >
            ← Back to Directory
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              {attorney.is_premium && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    FEATURED ATTORNEY
                  </span>
                </div>
              )}

              {attorney.is_verified && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ✓ VERIFIED BY JORDAN & ATLAS
                  </span>
                </div>
              )}

              <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: '10px 0' }}>
                {attorney.full_name}
              </h1>

              <p style={{ fontSize: '20px', opacity: 0.9, margin: '5px 0' }}>
                {attorney.professional_title}
              </p>

              {attorney.firm_name && (
                <p style={{ fontSize: '18px', opacity: 0.85, margin: '5px 0' }}>
                  {attorney.firm_name}
                </p>
              )}

              {attorney.city && attorney.state && (
                <p style={{ fontSize: '16px', opacity: 0.8, margin: '10px 0' }}>
                  📍 {attorney.city}, {attorney.state}
                </p>
              )}
            </div>

            <div>
              <button
                onClick={() => setShowInquiryForm(true)}
                style={{
                  padding: '16px 40px',
                  background: attorney.is_premium ? 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)' : 'white',
                  color: attorney.is_premium ? 'white' : '#667eea',
                  border: 'none',
                  borderRadius: '30px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                Contact {attorney.full_name.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Left Column */}
          <div>
            {/* About */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '30px'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                About
              </h2>
              <p style={{ color: '#666', lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap' }}>
                {attorney.bio || 'No biography provided.'}
              </p>
            </div>

            {/* Specializations */}
            {attorney.specializations && attorney.specializations.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px'
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                  Areas of Practice
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {attorney.specializations.map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#f3f4f6',
                        color: '#667eea',
                        padding: '10px 20px',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Publications */}
            {attorney.publications && (
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px'
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                  Publications
                </h2>
                <p style={{ color: '#666', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {attorney.publications}
                </p>
              </div>
            )}

            {/* Speaking Engagements */}
            {attorney.speaking_engagements && (
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px'
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                  Speaking Engagements
                </h2>
                <p style={{ color: '#666', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {attorney.speaking_engagements}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Contact Info */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                Quick Facts
              </h3>

              {attorney.years_experience && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '5px' }}>Experience</div>
                  <div style={{ fontSize: '18px', color: '#333', fontWeight: '600' }}>
                    {attorney.years_experience}+ years
                  </div>
                </div>
              )}

              {attorney.licensed_states && attorney.licensed_states.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '5px' }}>Licensed In</div>
                  <div style={{ fontSize: '16px', color: '#333' }}>
                    {attorney.licensed_states.join(', ')}
                  </div>
                </div>
              )}

              {attorney.bar_number && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '5px' }}>Bar Number</div>
                  <div style={{ fontSize: '16px', color: '#333' }}>
                    {attorney.bar_number}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
                  Connect
                </h4>

                {attorney.website_url && (
                  <a
                    href={attorney.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '10px',
                      color: '#667eea',
                      textDecoration: 'none',
                      marginBottom: '10px'
                    }}
                  >
                    🌐 Website
                  </a>
                )}

                {attorney.linkedin_url && (
                  <a
                    href={attorney.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '10px',
                      color: '#667eea',
                      textDecoration: 'none',
                      marginBottom: '10px'
                    }}
                  >
                    💼 LinkedIn
                  </a>
                )}

                <button
                  onClick={() => setShowInquiryForm(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowInquiryForm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
              Contact {attorney.full_name}
            </h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Send your inquiry directly to {attorney.full_name.split(' ')[0]}'s office.
            </p>

            <form onSubmit={handleInquirySubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={inquiryData.name}
                  onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={inquiryData.email}
                  onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={inquiryData.phone}
                  onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Message *
                </label>
                <textarea
                  required
                  value={inquiryData.message}
                  onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f3f4f6',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
