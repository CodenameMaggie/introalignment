import { useState, useEffect } from 'react';

export function useIntroductions() {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    try {
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      setCredits(data.introductions_remaining || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function useCredit(matchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/billing/use-introduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });

      const data = await res.json();

      if (data.success) {
        setCredits(prev => prev - 1);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function purchaseCredits(quantity: number = 1): Promise<string | null> {
    const slug = quantity >= 3 ? 'intro-3-pack' : 'extra-intro';

    try {
      const res = await fetch('/api/billing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: slug })
      });

      const data = await res.json();
      return data.url || null;
    } catch (error) {
      console.error('Purchase error:', error);
      return null;
    }
  }

  return {
    credits,
    loading,
    useCredit,
    purchaseCredits,
    hasCredits: credits > 0,
    refresh: fetchCredits
  };
}
