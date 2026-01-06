/**
 * Rule-based response system for bots
 * Works without AI API - uses keyword matching and templates
 */

export interface ResponseTemplate {
  keywords: string[];
  response: string;
  priority: number;
}

export const ANNIE_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['match', 'matches', 'matching', 'compatibility'],
    response: "I can help you find compatible matches! Our system analyzes your profile, interests, and preferences to suggest people who align with what you're looking for. Would you like me to explain how our matching algorithm works, or would you prefer to see your current matches?",
    priority: 100
  },
  {
    keywords: ['profile', 'update profile', 'edit profile'],
    response: "You can update your profile anytime from your dashboard. Make sure to keep your interests, photos, and bio current - this helps us find better matches for you!",
    priority: 90
  },
  {
    keywords: ['message', 'messages', 'chat', 'conversation'],
    response: "To start a conversation, visit your matches page and click on someone's profile. Remember to be genuine and respectful - great conversations start with thoughtful questions!",
    priority: 85
  },
  {
    keywords: ['premium', 'subscription', 'upgrade', 'paid'],
    response: "Our premium features include unlimited matches, advanced filters, and priority support. I can connect you with Dave, our billing specialist, if you'd like to learn more about upgrading.",
    priority: 80
  },
  {
    keywords: ['help', 'support', 'question'],
    response: "I'm here to help! I can assist with matches, profiles, conversations, and general questions about IntroAlignment. What would you like to know?",
    priority: 70
  },
  {
    keywords: ['complaint', 'problem', 'issue', 'bug'],
    response: "I'm sorry you're experiencing issues. Let me escalate this to our support team for priority handling. Can you describe what's happening in more detail?",
    priority: 95
  }
];

export const ATLAS_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['route', 'redirect', 'bot', 'which bot'],
    response: "I'm ATLAS, the routing bot. I help direct your questions to the right specialist: ANNIE (matchmaking), HENRY (onboarding), DAVE (billing), DAN (marketing), or JORDAN (safety).",
    priority: 100
  }
];

export const HENRY_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['onboard', 'getting started', 'new user', 'setup'],
    response: "Welcome to IntroAlignment! I'll help you get started. First, complete your profile with a photo and bio. Then, set your preferences. Finally, start browsing matches! Need help with any step?",
    priority: 100
  },
  {
    keywords: ['verify', 'verification', 'photo verification'],
    response: "Photo verification helps keep our community safe. Upload a selfie matching your profile photo, and we'll review it within 24 hours.",
    priority: 90
  }
];

export const DAVE_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['billing', 'payment', 'subscription', 'cancel', 'refund'],
    response: "I handle all billing matters. You can manage your subscription from your account settings. For refunds or billing questions, please provide your account email and I'll look into it.",
    priority: 100
  },
  {
    keywords: ['price', 'cost', 'how much'],
    response: "We offer flexible plans: Free (basic features), Premium ($14.99/month), and VIP ($29.99/month). Each tier unlocks additional features to help you find better matches.",
    priority: 90
  }
];

export const DAN_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['promo', 'discount', 'coupon', 'referral'],
    response: "Great timing! Refer a friend and both of you get 1 month free premium. Share your unique referral link from your dashboard.",
    priority: 100
  },
  {
    keywords: ['newsletter', 'unsubscribe', 'email'],
    response: "You can manage email preferences in your account settings. Choose which updates you want to receive.",
    priority: 80
  }
];

export const JORDAN_RESPONSES: ResponseTemplate[] = [
  {
    keywords: ['report', 'block', 'harassment', 'safety', 'abuse'],
    response: "Safety is our top priority. If someone is violating our community guidelines, please report them immediately. I'll review and take appropriate action within 24 hours.",
    priority: 100
  },
  {
    keywords: ['privacy', 'data', 'security'],
    response: "We take your privacy seriously. Your data is encrypted, never sold, and you can delete your account anytime. See our privacy policy for full details.",
    priority: 90
  }
];

/**
 * Generate a response based on keywords without AI
 */
export function generateRuleBasedResponse(
  message: string,
  botName: 'annie' | 'atlas' | 'henry' | 'dave' | 'dan' | 'jordan'
): string {
  const responseSets: Record<string, ResponseTemplate[]> = {
    annie: ANNIE_RESPONSES,
    atlas: ATLAS_RESPONSES,
    henry: HENRY_RESPONSES,
    dave: DAVE_RESPONSES,
    dan: DAN_RESPONSES,
    jordan: JORDAN_RESPONSES
  };

  const templates = responseSets[botName] || [];
  const messageLower = message.toLowerCase();

  // Score each template based on keyword matches
  const scored = templates.map(template => {
    const matches = template.keywords.filter(keyword =>
      messageLower.includes(keyword.toLowerCase())
    );
    return {
      template,
      score: matches.length * template.priority
    };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Return best match or default
  if (scored[0] && scored[0].score > 0) {
    return scored[0].template.response;
  }

  // Default responses by bot
  const defaults: Record<string, string> = {
    annie: "Thanks for reaching out! I'm ANNIE, your matchmaking assistant. I can help with questions about matches, your profile, or conversations. What would you like to know?",
    atlas: "I'm ATLAS, the routing bot. Let me know what you need help with and I'll connect you with the right specialist.",
    henry: "Hi! I'm HENRY. I help with onboarding and account setup. How can I assist you today?",
    dave: "I'm DAVE, your billing specialist. I can help with subscriptions, payments, or refunds. What do you need?",
    dan: "I'm DAN from marketing. I can help with promotions, newsletters, or referrals. What interests you?",
    jordan: "I'm JORDAN, focused on safety and compliance. I can help with reports, privacy, or security concerns. What's on your mind?"
  };

  return defaults[botName] || "I'm here to help! How can I assist you?";
}

/**
 * Check if message requires escalation to human
 */
export function requiresEscalation(message: string): boolean {
  const escalationKeywords = [
    'urgent', 'emergency', 'complaint', 'lawyer', 'legal',
    'sue', 'terrible', 'awful', 'refund', 'unacceptable',
    'discrimination', 'harassment', 'assault', 'threat'
  ];

  const messageLower = message.toLowerCase();
  return escalationKeywords.some(keyword => messageLower.includes(keyword));
}
