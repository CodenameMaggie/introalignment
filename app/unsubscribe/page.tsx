'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const messages = {
    success: {
      icon: '✓',
      title: 'Successfully Unsubscribed',
      message: 'You have been removed from our email list. You will no longer receive outreach emails from IntroAlignment.',
      color: 'sage'
    },
    already: {
      icon: 'ℹ',
      title: 'Already Unsubscribed',
      message: 'This email address has already been unsubscribed from our list.',
      color: 'gold'
    },
    invalid: {
      icon: '✗',
      title: 'Invalid Link',
      message: 'This unsubscribe link is invalid or has expired. Please contact us directly if you wish to unsubscribe.',
      color: 'charcoal'
    },
    expired: {
      icon: '⏱',
      title: 'Link Expired',
      message: 'This unsubscribe link has expired. Please contact us directly to unsubscribe.',
      color: 'charcoal'
    },
    notfound: {
      icon: '?',
      title: 'Email Not Found',
      message: 'We could not find this email address in our system.',
      color: 'charcoal'
    },
    error: {
      icon: '!',
      title: 'Error',
      message: 'An error occurred while processing your request. Please try again or contact us directly.',
      color: 'charcoal'
    }
  };

  const current = messages[status as keyof typeof messages] || messages.invalid;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-2xl bg-white p-12 rounded-lg shadow-luxury text-center">
        <div className="text-6xl mb-6">{current.icon}</div>
        <h1 className="font-heading text-4xl font-bold text-obsidian mb-4">
          {current.title}
        </h1>
        <p className="font-body text-xl text-charcoal mb-8">
          {current.message}
        </p>

        {status === 'success' && (
          <div className="bg-sage/10 p-6 rounded-lg border-l-4 border-sage mb-8">
            <p className="font-body text-charcoal">
              <strong className="font-heading text-obsidian">Note:</strong> You may still receive:
            </p>
            <ul className="font-body text-charcoal text-left mt-4 space-y-2 ml-6">
              <li>• Transactional emails (if you have an account)</li>
              <li>• Response to direct inquiries you initiate</li>
              <li>• Legal notices if required by law</li>
            </ul>
          </div>
        )}

        {(status === 'invalid' || status === 'expired' || status === 'error') && (
          <div className="bg-gold-muted/20 p-6 rounded-lg border-l-4 border-gold mb-8">
            <p className="font-body text-charcoal">
              <strong className="font-heading text-obsidian">Need help?</strong>
            </p>
            <p className="font-body text-charcoal mt-2">
              Contact us at: <a href="mailto:support@introalignment.com" className="text-gold hover:text-gold-dark underline">support@introalignment.com</a>
            </p>
          </div>
        )}

        <Link
          href="/"
          className="inline-block bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-8 py-3 rounded-lg transition-all"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-heading text-2xl text-charcoal">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
