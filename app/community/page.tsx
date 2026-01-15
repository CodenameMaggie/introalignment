'use client';

import { useState } from 'react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('discussions');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '42px', marginBottom: '15px', fontWeight: 'normal', letterSpacing: '2px' }}>
          IntroAlignment Community
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Connect, Share, and Grow with Elite Estate Planning Attorneys
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px'
      }}>
        {['discussions', 'resources', 'events'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '20px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #d4a574' : '3px solid transparent',
              color: activeTab === tab ? '#2c3e50' : '#7f8c8d',
              fontSize: '16px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.3s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {activeTab === 'discussions' && <DiscussionsTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'events' && <EventsTab />}
      </div>
    </div>
  );
}

function DiscussionsTab() {
  const discussions = [
    {
      id: 1,
      title: 'Dynasty Trust Strategies for 2026 Estate Tax Changes',
      author: 'Sarah Mitchell',
      replies: 12,
      views: 156,
      category: 'Estate Planning',
      lastActivity: '2 hours ago',
      isPopular: true
    },
    {
      id: 2,
      title: 'Asset Protection: Delaware vs. Nevada LLCs',
      author: 'David Chen',
      replies: 8,
      views: 94,
      category: 'Asset Protection',
      lastActivity: '5 hours ago',
      isPopular: false
    },
    {
      id: 3,
      title: 'Cross-Border Estate Planning Challenges',
      author: 'Jennifer Williams',
      replies: 15,
      views: 203,
      category: 'International',
      lastActivity: '1 day ago',
      isPopular: true
    },
    {
      id: 4,
      title: 'Best Practices for Ultra-High-Net-Worth Client Onboarding',
      author: 'Robert Anderson',
      replies: 24,
      views: 312,
      category: 'Practice Management',
      lastActivity: '2 days ago',
      isPopular: true
    }
  ];

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Welcome to the Community Forum</h2>
        <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.6' }}>
          Share insights, ask questions, and connect with fellow estate planning attorneys across the country.
          This is your space to discuss cases, strategies, and best practices.
        </p>
        <button style={{
          background: '#d4a574',
          color: 'white',
          border: 'none',
          padding: '12px 30px',
          borderRadius: '25px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '15px'
        }}>
          Start New Discussion
        </button>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {discussions.map((discussion) => (
          <div
            key={discussion.id}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid #e0e0e0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{
                    background: '#f0f0f0',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {discussion.category}
                  </span>
                  {discussion.isPopular && (
                    <span style={{ fontSize: '14px' }}>🔥</span>
                  )}
                </div>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: '#2c3e50',
                  fontSize: '20px',
                  fontWeight: 'normal'
                }}>
                  {discussion.title}
                </h3>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  By <strong>{discussion.author}</strong> • {discussion.lastActivity}
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                minWidth: '120px',
                paddingLeft: '20px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d4a574' }}>
                  {discussion.replies}
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>replies</div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>
                  {discussion.views} views
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button style={{
          background: 'transparent',
          color: '#d4a574',
          border: '2px solid #d4a574',
          padding: '10px 25px',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Load More Discussions
        </button>
      </div>
    </div>
  );
}

function ResourcesTab() {
  const resources = [
    {
      title: 'Dynasty Trust Legal Templates',
      description: 'Comprehensive template library for dynasty trusts across all 50 states',
      type: 'Templates',
      downloads: 234
    },
    {
      title: 'Client Presentation Deck: Asset Protection 101',
      description: 'Professional slide deck to educate clients on asset protection strategies',
      type: 'Presentation',
      downloads: 156
    },
    {
      title: 'Estate Tax Exemption Calculator 2026',
      description: 'Interactive spreadsheet for calculating estate tax implications',
      type: 'Tool',
      downloads: 189
    },
    {
      title: 'Cross-Border Estate Planning Checklist',
      description: 'Step-by-step checklist for international estate planning engagements',
      type: 'Checklist',
      downloads: 142
    }
  ];

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Professional Resources</h2>
        <p style={{ color: '#555', fontSize: '16px' }}>
          Access templates, tools, and resources curated for elite estate planning attorneys.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {resources.map((resource, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}
          >
            <div style={{
              background: '#f8f9fa',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#666',
              display: 'inline-block',
              marginBottom: '15px'
            }}>
              {resource.type}
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#2c3e50' }}>
              {resource.title}
            </h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', marginBottom: '15px' }}>
              {resource.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
                📥 {resource.downloads} downloads
              </span>
              <button style={{
                background: '#d4a574',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsTab() {
  const events = [
    {
      title: 'Dynasty Trust Masterclass Webinar',
      date: 'January 25, 2026',
      time: '2:00 PM EST',
      attendees: 47,
      maxAttendees: 100,
      type: 'Webinar',
      description: 'Deep dive into advanced dynasty trust structures for ultra-high-net-worth families'
    },
    {
      title: 'Attorney Networking Happy Hour',
      date: 'January 30, 2026',
      time: '5:00 PM EST',
      attendees: 23,
      maxAttendees: 50,
      type: 'Networking',
      description: 'Virtual networking event - connect with estate planning attorneys nationwide'
    },
    {
      title: 'Asset Protection Summit',
      date: 'February 15, 2026',
      time: '10:00 AM EST',
      attendees: 89,
      maxAttendees: 200,
      type: 'Conference',
      description: 'Full-day virtual summit on asset protection strategies and legal updates'
    }
  ];

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Upcoming Events</h2>
        <p style={{ color: '#555', fontSize: '16px' }}>
          Join webinars, networking events, and educational sessions with your peers.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {events.map((event, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '30px'
            }}
          >
            <div>
              <div style={{
                background: '#f8f9fa',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#666',
                display: 'inline-block',
                marginBottom: '15px'
              }}>
                {event.type}
              </div>
              <h3 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#2c3e50' }}>
                {event.title}
              </h3>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '15px' }}>
                {event.description}
              </p>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                📅 {event.date} • 🕐 {event.time}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                👥 {event.attendees}/{event.maxAttendees} registered
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button style={{
                background: '#d4a574',
                color: 'white',
                border: 'none',
                padding: '15px 35px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                Register Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
