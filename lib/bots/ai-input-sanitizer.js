/**
 * AI Input Sanitizer
 * Prevents prompt injection attacks and enforces input limits
 */

const MAX_MESSAGE_LENGTH = 10000; // 10k characters
const MAX_CONVERSATION_HISTORY = 500; // Last 500 messages (increased for Henry's extensive memory)

/**
 * Sanitize AI chat message to prevent prompt injection
 * @param {string} message - User message
 * @returns {Object} { valid: boolean, sanitized: string, error: string|null }
 */
function sanitizeAIMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, sanitized: '', error: 'Message is required' };
  }

  // Trim whitespace
  let sanitized = message.trim();

  // Check length
  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Message cannot be empty' };
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      sanitized: '',
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`
    };
  }

  // Detect common prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?previous/i,
    /forget\s+(all\s+)?previous/i,
    /you\s+are\s+now/i,
    /new\s+instructions:/i,
    /system\s*:/i,
    /\[SYSTEM\]/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /assistant\s*:/i,
    /\[\/INST\]/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('[AI Input Sanitizer] Potential prompt injection detected');
      return {
        valid: false,
        sanitized: '',
        error: 'Message contains potentially unsafe content. Please rephrase your question.'
      };
    }
  }

  // Check for excessive special characters (potential injection)
  const specialCharCount = (sanitized.match(/[<>{}\[\]\\|]/g) || []).length;
  const specialCharRatio = specialCharCount / sanitized.length;

  if (specialCharRatio > 0.1) { // More than 10% special chars
    console.warn('[AI Input Sanitizer] Excessive special characters detected');
    return {
      valid: false,
      sanitized: '',
      error: 'Message contains too many special characters. Please use normal text.'
    };
  }

  return { valid: true, sanitized, error: null };
}

/**
 * Limit conversation history to prevent token overflow
 * @param {Array} history - Conversation history
 * @returns {Array} Truncated history
 */
function limitConversationHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  // Keep only the most recent messages
  if (history.length > MAX_CONVERSATION_HISTORY) {
    console.log(`[AI Input Sanitizer] Truncating conversation history from ${history.length} to ${MAX_CONVERSATION_HISTORY} messages`);
    return history.slice(-MAX_CONVERSATION_HISTORY);
  }

  return history;
}

/**
 * Validate conversation ID format
 * @param {string} conversationId - Conversation ID
 * @returns {boolean} Valid or not
 */
function isValidConversationId(conversationId) {
  if (!conversationId) return true; // Optional parameter

  // Must be UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(conversationId);
}

module.exports = {
  sanitizeAIMessage,
  limitConversationHistory,
  isValidConversationId,
  MAX_MESSAGE_LENGTH,
  MAX_CONVERSATION_HISTORY
};
