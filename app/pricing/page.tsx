'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const features = {
    free: [
      'Basic profile in attorney directory',
      'Podcast invitation opportunities',
      'Weekly newsletter with legal insights',
      'Community forum access (read-only)',
      'Jordan + Atlas data verification',
      'IntroAlignment network membership'
    ],
    premium: [
      'Everything in Free, plus:',
      'Featured placement in directory',
      'Priority podcast booking',
      'Direct client inquiry routing',
      'Enhanced profile with video & portfolio',
      'Analytics dashboard (views, inquiries)',
      'Full community forum participation',
      'Monthly performance reports',
      'Custom URL for your profile',
      'Remove "Free Member" badge',
      'Early access to new features'
    ]
  };

  const pricing = {
    monthly: 197,
    annual: 1970 // ~$164/month, 2 months free
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 20px 0' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Start free and upgrade when you're ready to maximize your reach
        </p>
      </div>

      {/* Billing Toggle */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50px',
          padding: '4px'
        }}>
          <button
            onClick={() => setBillingPeriod('monthly')}
            style={{
              padding: '12px 30px',
              border: 'none',
              borderRadius: '50px',
              background: billingPeriod === 'monthly' ? 'white' : 'transparent',
              color: billingPeriod === 'monthly' ? '#667eea' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            style={{
              padding: '12px 30px',
              border: 'none',
              borderRadius: '50px',
              background: billingPeriod === 'annual' ? 'white' : 'transparent',
              color: billingPeriod === 'annual' ? '#667eea' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative'
            }}
          >
            Annual
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#10b981',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              SAVE 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 80px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '40px'
      }}>
        {/* Free Plan */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>
              Free
            </h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', margin: '20px 0' }}>
              $0
              <span style={{ fontSize: '20px', color: '#999', fontWeight: 'normal' }}>/forever</span>
            </div>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Perfect for getting started
            </p>
          </div>

          <Link
            href="/signup"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '18px',
              textDecoration: 'none',
              marginBottom: '30px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Get Started Free
          </Link>

          <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
              What's included:
            </h3>
            {features.free.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ color: '#10b981', marginRight: '12px', fontSize: '20px' }}>✓</span>
                <span style={{ color: '#666', fontSize: '16px' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Plan */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          border: '3px solid #d4a574'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)',
            color: 'white',
            padding: '8px 30px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)'
          }}>
            MOST POPULAR
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>
              Premium
            </h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', margin: '20px 0' }}>
              ${billingPeriod === 'monthly' ? pricing.monthly : Math.round(pricing.annual / 12)}
              <span style={{ fontSize: '20px', color: '#999', fontWeight: 'normal' }}>
                /{billingPeriod === 'monthly' ? 'month' : 'month'}
              </span>
            </div>
            {billingPeriod === 'annual' && (
              <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                ${pricing.annual}/year (save ${(pricing.monthly * 12) - pricing.annual}/year)
              </p>
            )}
            <p style={{ color: '#666', fontSize: '16px' }}>
              For attorneys ready to grow their practice
            </p>
          </div>

          <Link
            href="/upgrade"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #d4a574 0%, #c9963d 100%)',
              color: 'white',
              textAlign: 'center',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '18px',
              textDecoration: 'none',
              marginBottom: '30px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Upgrade to Premium
          </Link>

          <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
              Everything in Free, plus:
            </h3>
            {features.premium.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ color: '#d4a574', marginRight: '12px', fontSize: '20px', fontWeight: 'bold' }}>✓</span>
                <span style={{
                  color: i === 0 ? '#333' : '#666',
                  fontSize: '16px',
                  fontWeight: i === 0 ? 'bold' : 'normal'
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 20px',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            Can I try Premium before committing?
          </h3>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            Yes! Start with the free plan to experience IntroAlignment. When you're ready, upgrade to Premium and cancel anytime - no long-term contracts.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            How do client inquiries work?
          </h3>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            Premium members receive direct email notifications when high-net-worth clients search for attorneys in their specialization. Free members are listed in search results but inquiries go to premium members first.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            What is Jordan + Atlas verification?
          </h3>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            Our AI verification system (Jordan for analytics, Atlas for legal research) ensures all attorney data is accurate and credible before any outreach or publication. This protects both attorneys and clients.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            Can I cancel my Premium subscription?
          </h3>
          <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
            Absolutely. Cancel anytime from your dashboard. You'll retain Premium access until the end of your billing period, then automatically revert to the Free plan.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
          Join 64+ Estate Planning Attorneys
        </h2>
        <p style={{ fontSize: '20px', color: 'white', opacity: 0.9, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Connect with high-net-worth clients seeking dynasty trust and asset protection counsel
        </p>
        <Link
          href="/signup"
          style={{
            display: 'inline-block',
            padding: '18px 50px',
            background: 'white',
            color: '#667eea',
            borderRadius: '50px',
            fontWeight: 'bold',
            fontSize: '20px',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
