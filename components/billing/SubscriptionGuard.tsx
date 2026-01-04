'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: string[];
  requiredFeature?: 'can_message' | 'can_see_compatibility_score' | 'can_see_detailed_report' | 'priority_matching';
  fallback?: React.ReactNode;
}

export default function SubscriptionGuard({
  children,
  requiredPlan,
  requiredFeature,
  fallback
}: SubscriptionGuardProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      setSubscription(data);

      let access = true;

      // Check plan requirement
      if (requiredPlan && data.plan) {
        access = requiredPlan.includes(data.plan.slug);
      }

      // Check feature requirement
      if (requiredFeature && data.plan) {
        access = access && data.plan[requiredFeature];
      }

      setHasAccess(access);
    } catch (error) {
      console.error('Subscription check error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-burgundy mb-4">
            Upgrade Required
          </h2>
          <p className="text-charcoal-light mb-6">
            This feature requires a paid subscription. Upgrade your plan to access it.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-6 py-3 bg-burgundy text-white rounded-full hover:bg-burgundy-dark transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
