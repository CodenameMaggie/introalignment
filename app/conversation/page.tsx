'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ConversationChat from '@/components/conversation/ConversationChat';
import QuestionnaireForm from '@/components/conversation/QuestionnaireForm';

function ConversationPageContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);
    setIsLoading(false);
  }

  function handleConversationComplete() {
    // Redirect to dashboard when conversation is complete
    router.push('/dashboard-interactive');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-light via-cream to-blush">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  // Check which conversation mode to use
  const useAI = process.env.NEXT_PUBLIC_ENABLE_AI_CONVERSATION === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-light via-cream to-blush py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Get to Know You
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {useAI
              ? 'Have a natural conversation with us to build your deep compatibility profile.'
              : 'Answer some questions to help us build your compatibility profile.'}
            {' '}The more you share, the better we can match you.
          </p>
        </div>

        {/* Questionnaire or Chat based on AI mode */}
        {useAI ? (
          <ConversationChat
            userId={userId}
            onComplete={handleConversationComplete}
          />
        ) : (
          <QuestionnaireForm
            userId={userId}
            onComplete={handleConversationComplete}
          />
        )}

        {/* Info Section */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              💡 How This Works
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>{useAI ? 'Natural Conversation' : 'Structured Questions'}:</strong> We'll guide you through 7 chapters covering different aspects of your life and personality.
              </p>
              <p>
                <strong>22 Questions Total:</strong> {useAI ? "We'll explore topics naturally and go deeper where it matters." : "Take your time with each question and answer as openly as you'd like."}
              </p>
              <p>
                <strong>Privacy First:</strong> Your responses are private and used only to find compatible matches.
              </p>
              <p>
                <strong>Take Your Time:</strong> You can pause anytime and come back later. Your progress is saved automatically.
              </p>
            </div>
          </div>

          {/* Chapter Overview */}
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📚 The 7 Chapters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-2xl">🌍</span>
                <div>
                  <p className="font-semibold text-gray-800">Your World</p>
                  <p className="text-gray-600">Where you are in life</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-2xl">📖</span>
                <div>
                  <p className="font-semibold text-gray-800">Your Story</p>
                  <p className="text-gray-600">Your journey so far</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-2xl">💞</span>
                <div>
                  <p className="font-semibold text-gray-800">Your Relationships</p>
                  <p className="text-gray-600">How you connect</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="font-semibold text-gray-800">Your Mind</p>
                  <p className="text-gray-600">How you think</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-2xl">❤️</span>
                <div>
                  <p className="font-semibold text-gray-800">Your Heart</p>
                  <p className="text-gray-600">What you value</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="font-semibold text-gray-800">Your Future</p>
                  <p className="text-gray-600">Where you're headed</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 md:col-span-2">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold text-gray-800">The Details</p>
                  <p className="text-gray-600">The little things that matter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-light via-cream to-blush">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConversationPageContent />
    </Suspense>
  );
}
