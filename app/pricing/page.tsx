'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  introductions_per_month: number;
  can_message: boolean;
  can_see_compatibility_score: boolean;
  can_see_detailed_report: boolean;
  priority_matching: boolean;
  human_review: boolean;
  concierge_service: boolean;
  is_featured: boolean;
  badge_text: string | null;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const res = await fetch('/api/billing/plans');
    const data = await res.json();
    setPlans(data.plans);
  }

  async function handleSubscribe(planSlug: string) {
    if (planSlug === 'free') {
      router.push('/signup');
      return;
    }

    setLoading(planSlug);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, interval })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-ivory py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-burgundy mb-4">
            Find Your Aligned Partner
          </h1>
          <p className="text-xl text-charcoal-light max-w-2xl mx-auto">
            Choose the plan that fits your journey. All plans include our
            comprehensive personality profiling and matching algorithm.
          </p>
        </div>

        {/* Interval Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setInterval('month')}
              className={`px-6 py-2 rounded-full transition-all ${
                interval === 'month'
                  ? 'bg-burgundy text-white'
                  : 'text-charcoal hover:bg-ivory-dark'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-6 py-2 rounded-full transition-all ${
                interval === 'year'
                  ? 'bg-burgundy text-white'
                  : 'text-charcoal hover:bg-ivory-dark'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-copper text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 relative ${
                plan.is_featured
                  ? 'ring-2 ring-burgundy shadow-xl scale-105'
                  : 'shadow-md'
              }`}
            >
              {/* Badge */}
              {plan.badge_text && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-burgundy text-white text-sm px-4 py-1 rounded-full">
                  {plan.badge_text}
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-semibold text-burgundy mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-charcoal-light mb-4">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-charcoal">
                  ${interval === 'year'
                    ? Math.round(plan.price_yearly / 12)
                    : plan.price_monthly}
                </span>
                <span className="text-charcoal-light">/mo</span>
                {interval === 'year' && plan.price_yearly > 0 && (
                  <div className="text-sm text-copper">
                    Billed ${plan.price_yearly}/year
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                <Feature
                  included={true}
                  text={plan.introductions_per_month === -1
                    ? 'Unlimited introductions'
                    : plan.introductions_per_month === 0
                      ? 'No introductions'
                      : `${plan.introductions_per_month} introductions/month`}
                />
                <Feature
                  included={plan.can_message}
                  text="Direct messaging"
                />
                <Feature
                  included={plan.can_see_compatibility_score}
                  text="Compatibility scores"
                />
                <Feature
                  included={plan.can_see_detailed_report}
                  text="Detailed reports"
                />
                <Feature
                  included={plan.priority_matching}
                  text="Priority matching"
                />
                <Feature
                  included={plan.human_review}
                  text="Human matchmaker review"
                />
                <Feature
                  included={plan.concierge_service}
                  text="Concierge service"
                />
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSubscribe(plan.slug)}
                disabled={loading === plan.slug}
                className={`w-full py-3 rounded-full font-medium transition-all ${
                  plan.is_featured
                    ? 'bg-burgundy text-white hover:bg-burgundy-dark'
                    : plan.slug === 'free'
                      ? 'bg-ivory-dark text-charcoal hover:bg-dusty-rose-light'
                      : 'bg-dusty-rose text-burgundy hover:bg-dusty-rose-dark'
                } disabled:opacity-50`}
              >
                {loading === plan.slug
                  ? 'Loading...'
                  : plan.slug === 'free'
                    ? 'Get Started'
                    : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="mt-16">
          <h2 className="text-2xl font-serif font-bold text-burgundy text-center mb-8">
            Add-ons
          </h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <AddOnCard
              name="Extra Introduction"
              price="$29"
              description="One additional introduction"
              slug="extra-intro"
            />
            <AddOnCard
              name="3-Pack Introductions"
              price="$69"
              description="Three introductions (save $18)"
              slug="intro-3-pack"
            />
            <AddOnCard
              name="Compatibility Report"
              price="$19"
              description="Detailed 10-page analysis"
              slug="compatibility-report"
            />
            <AddOnCard
              name="Profile Review"
              price="$99"
              description="Professional optimization"
              slug="profile-review"
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-burgundy text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQ
              q="What's an introduction?"
              a="An introduction is when we connect you with a matched member. You'll receive their profile and compatibility report, and they'll receive yours. If both parties are interested, you can begin communicating."
            />
            <FAQ
              q="Can I cancel anytime?"
              a="Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
            />
            <FAQ
              q="Do unused introductions roll over?"
              a="No, introductions reset each billing period. However, you can purchase additional introductions that last for one year."
            />
            <FAQ
              q="What's the difference between Aligned and Founder?"
              a="Founder members receive unlimited introductions, personal attention from our human matchmaking team, and priority in all matches. It's our premium white-glove service."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ included, text }: { included: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 ${included ? 'text-charcoal' : 'text-charcoal-light line-through'}`}>
      {included ? (
        <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {text}
    </li>
  );
}

function AddOnCard({ name, price, description, slug }: {
  name: string;
  price: string;
  description: string;
  slug: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: slug })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h4 className="font-medium text-charcoal">{name}</h4>
      <p className="text-sm text-charcoal-light mb-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-burgundy">{price}</span>
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="text-sm px-3 py-1 bg-ivory-dark rounded-full hover:bg-dusty-rose-light transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Buy'}
        </button>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ivory-dark pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="font-medium text-charcoal">{q}</span>
        <svg
          className={`w-5 h-5 text-burgundy transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="mt-2 text-charcoal-light">{a}</p>
      )}
    </div>
  );
}
