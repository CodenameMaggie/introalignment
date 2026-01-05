'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give webhook a moment to process
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-sage bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">
              Processing...
            </h1>
            <p className="text-charcoal-light">
              We're setting up your subscription
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-sage bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">
              Welcome to IntroAlignment!
            </h1>
            <p className="text-charcoal-light mb-6">
              Your subscription is now active. Let's find your aligned partner.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-champagne text-charcoal-dark rounded-full hover:bg-champagne-light transition-colors font-semibold"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/settings/billing')}
                className="w-full px-6 py-3 bg-ivory-dark text-charcoal rounded-full hover:bg-soft-gray transition-colors"
              >
                View Billing Details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-sage bg-opacity-20 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
