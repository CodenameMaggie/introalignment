'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Questionnaire from '@/components/user/Questionnaire';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user session
    const session = localStorage.getItem('session');
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      setUserId(sessionData.user?.id);
      setLoading(false);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleComplete = () => {
    // Questionnaire complete - redirect to dashboard
    router.push('/dashboard?welcome=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return <Questionnaire userId={userId} onComplete={handleComplete} />;
}
