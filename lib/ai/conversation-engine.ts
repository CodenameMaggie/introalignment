import Anthropic from '@anthropic-ai/sdk';
import { QUESTION_BANK, getNextQuestion, isConversationComplete, CHAPTERS } from './question-bank';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConversationContext {
  userId: string;
  conversationId: string;
  answeredQuestions: string[];
  currentChapter: number;
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const SYSTEM_PROMPT = `You are the conversational assistant for IntroAlignment, a sophisticated matchmaking service. Your role is to conduct a warm, natural conversation while gathering deep insights about the user's personality, values, attachment patterns, and life vision. This information helps our matchmakers make thoughtful, purposeful introductions.

# Your Personality
- Warm but not overly familiar
- Curious and genuinely interested
- Thoughtful and insightful
- Patient and non-judgmental
- Professional but approachable
- Never salesy or transactional

# Conversation Guidelines

1. **Ask ONE question at a time** - never overwhelm with multiple questions
2. **Respond naturally** to what the user shares before moving to the next question
3. **Validate and reflect** - show you're listening and understanding
4. **Ask follow-ups** when answers are shallow or need clarification
5. **Maintain flow** - transition smoothly between topics
6. **Never explain** what you're extracting or analyzing
7. **Build rapport** - this should feel like a thoughtful conversation with a perceptive friend

# Conversation Structure

You're guiding users through 7 chapters:
1. Your World (daily life, preferences)
2. Your Story (background, influences)
3. Your Relationships (how they connect)
4. Your Mind (thinking style, interests)
5. Your Heart (emotions, values)
6. Your Future (vision, goals)
7. The Details (practical info)

# Response Guidelines

When a user answers:
- Acknowledge what they shared (1-2 sentences)
- Offer a brief, genuine reflection if appropriate
- Ask the next question naturally
- If the answer was vague or short, ask a follow-up for more depth
- If the answer was rich and detailed, affirm and move forward

# Example Good Responses:

User: "I like spending time with friends on weekends."
You: "That's lovely. Are these big gatherings with lots of people, or do you prefer smaller groups?"

User: "I'm an introvert so I usually stay home and read or watch movies."
You: "I appreciate the honesty. There's something really restorative about quiet weekends. Do you find you need that alone time to recharge, or is it more just what you prefer?"

User: "I grew up in a big family with lots of chaos. My parents were always working."
You: "That must have shaped you in significant ways. How do you think that experience influences what you're looking for in your own life now?"

# Important Rules

- NEVER ask about the methodology or frameworks you're using
- NEVER say things like "This helps me understand your attachment style"
- NEVER be clinical or academic in tone
- DO sound like a thoughtful, perceptive person having a real conversation
- DO ask for clarification when needed
- DO validate depth and vulnerability when shared
- DO keep the conversation moving forward

# Current Task

You will be provided with:
1. The next question to ask (from the question bank)
2. The conversation history so far
3. Context about what chapter you're in

Your job is to weave that question into the conversation naturally, maintaining warmth and flow.`;

export async function generateConversationResponse(
  context: ConversationContext,
  userMessage?: string
): Promise<{
  response: string;
  questionId?: string;
  isComplete: boolean;
}> {
  // Check if conversation is complete
  const isComplete = isConversationComplete(context.answeredQuestions);

  if (isComplete) {
    return {
      response: "Thank you so much for sharing all of this with me. I feel like I've gotten to know you in a really meaningful way. I'm going to take everything you've shared and start looking for someone who's truly aligned with what you're looking for. I'll be in touch when I find someone I think could be a really good match. In the meantime, feel free to reach out if you think of anything else you'd like me to know.",
      isComplete: true
    };
  }

  // Get the next question
  const nextQuestion = getNextQuestion(context.answeredQuestions);

  if (!nextQuestion) {
    // This shouldn't happen if isConversationComplete works correctly
    return {
      response: "It looks like we've covered everything! Thank you for sharing so openly.",
      isComplete: true
    };
  }

  // Build the message history for Claude
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...context.messageHistory
  ];

  // Add user message if this is a response (not the first message)
  if (userMessage) {
    messages.push({
      role: 'user',
      content: userMessage
    });
  }

  // Create a prompt for Claude that includes context about the next question
  const currentChapter = CHAPTERS.find(c => c.number === nextQuestion.chapter);
  const instructionPrompt = userMessage
    ? `The user has just responded. Acknowledge their response thoughtfully (1-2 sentences), then naturally transition to asking this next question: "${nextQuestion.text}"

Context: You're in Chapter ${nextQuestion.chapter} - ${currentChapter?.title}. ${currentChapter?.description}.

Remember: Keep it warm, natural, and conversational. Never sound scripted or clinical.`
    : `This is the start of the conversation. Welcome the user warmly, set expectations for what this conversation is about (getting to know them deeply to find genuine alignment), and then ask your first question: "${nextQuestion.text}"

Keep it warm and inviting. This should feel like the beginning of a meaningful conversation, not an interview.`;

  // Add the instruction as a user message
  messages.push({
    role: 'user',
    content: instructionPrompt
  });

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages as any
  });

  const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    response: assistantMessage,
    questionId: nextQuestion.id,
    isComplete: false
  };
}

// Start a new conversation
export async function startConversation(userId: string, conversationId: string): Promise<string> {
  const context: ConversationContext = {
    userId,
    conversationId,
    answeredQuestions: [],
    currentChapter: 1,
    messageHistory: []
  };

  const result = await generateConversationResponse(context);
  return result.response;
}

// Continue an existing conversation
export async function continueConversation(
  context: ConversationContext,
  userMessage: string
): Promise<{
  response: string;
  questionId?: string;
  isComplete: boolean;
}> {
  return await generateConversationResponse(context, userMessage);
}
