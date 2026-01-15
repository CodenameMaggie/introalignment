'use client';

import { useEffect, useState } from 'use';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initiateCheckout();
  }, []);

  async function initiateCheckout() {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: 'attorney-premium',
          interval: 'month'
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === 'Unauthorized') {
        // Not logged in - redirect to signup
        router.push('/signup?upgrade=true');
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to initiate checkout. Please try again.');
      router.push('/pricing');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '4px solid #667eea',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          margin: '0 auto 30px auto',
          animation: 'spin 1s linear infinite'
        }}></div>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
          Redirecting to Checkout
        </h1>

        <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.6' }}>
          Please wait while we prepare your premium subscription checkout...
        </p>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    </div>
  );
}
