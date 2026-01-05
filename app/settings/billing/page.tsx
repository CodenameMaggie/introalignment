'use client';

import { useState, useEffect } from 'react';

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    const [subRes, invRes] = await Promise.all([
      fetch('/api/billing/subscription'),
      fetch('/api/billing/invoices')
    ]);

    setSubscription(await subRes.json());
    setInvoices((await invRes.json()).invoices || []);
    setLoading(false);
  }

  async function openPortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-navy mb-8">Billing & Subscription</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-navy mb-1">
              Current Plan
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-navy">
                {subscription?.plan?.name || 'Free'}
              </span>
              {subscription?.status && subscription.status !== 'active' && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  subscription.status === 'past_due'
                    ? 'bg-rose-light text-navy-dark'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {subscription.status}
                </span>
              )}
            </div>
            {subscription?.plan?.price_monthly > 0 && (
              <p className="text-navy-light">
                ${subscription.plan.price_monthly}/month • {subscription.billing_interval}ly billing
              </p>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="px-4 py-2 bg-gold text-navy-dark rounded-full hover:bg-gold-light transition-colors font-medium"
          >
            {subscription?.plan?.slug === 'free' ? 'Upgrade' : 'Change Plan'}
          </button>
        </div>

        {/* Usage */}
        {subscription?.plan?.introductions_per_month !== 0 && (
          <div className="mt-6 pt-6 border-t border-cream-dark">
            <h3 className="text-sm font-medium text-navy-light mb-2">
              Introductions This Period
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-soft-gray rounded-full h-3">
                <div
                  className="bg-gold h-3 rounded-full transition-all"
                  style={{
                    width: subscription?.plan?.introductions_per_month === -1
                      ? '100%'
                      : `${(subscription?.introductions_used / subscription?.plan?.introductions_per_month) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-navy">
                {subscription?.plan?.introductions_per_month === -1
                  ? 'Unlimited'
                  : `${subscription?.introductions_used || 0} / ${subscription?.plan?.introductions_per_month}`}
              </span>
            </div>
            {subscription?.current_period_end && (
              <p className="text-xs text-navy-light mt-2">
                Resets on {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Cancellation notice */}
        {subscription?.cancel_at_period_end && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">
              Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
              <button
                onClick={openPortal}
                className="ml-2 underline"
              >
                Reactivate
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Manage Billing */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-navy mb-4">
          Manage Billing
        </h2>
        <p className="text-navy-light mb-4">
          Update your payment method, download invoices, or cancel your subscription.
        </p>
        <button
          onClick={openPortal}
          className="px-6 py-3 bg-navy text-cream rounded-full hover:bg-navy-light transition-colors font-medium"
        >
          Open Billing Portal
        </button>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy mb-4">
            Invoice History
          </h2>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 border-b border-cream-dark last:border-0"
              >
                <div>
                  <p className="font-medium text-navy">
                    ${invoice.amount_paid?.toFixed(2)}
                  </p>
                  <p className="text-sm text-navy-light">
                    {new Date(invoice.paid_at || invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status}
                  </span>
                  {invoice.invoice_pdf_url && (
                    <a
                      href={invoice.invoice_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline text-sm font-medium"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
