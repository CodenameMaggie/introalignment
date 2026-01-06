const { withAuth } = require('../lib/api-wrapper');
const { validateInput, getValidatedData } = require('../lib/validation-middleware');
const { csrfMiddleware } = require('../lib/csrf-protection');
/**
 * ATLAS - Knowledge Engine
 *
 * A shared intelligence layer that all bots can query.
 * Synthesizes knowledge from Gemini (free tier), Perplexity, Claude, and OpenAI.
 * Stores learnings in ai_memory_store for future use.
 *
 * @endpoint POST /api/atlas-knowledge
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../server/db');

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Perplexity uses OpenAI-compatible API
const perplexity = process.env.PERPLEXITY_API_KEY ? new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
}) : null;

// Google Gemini API
const gemini = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;

// ============================================
// KNOWLEDGE SOURCE FUNCTIONS
// ============================================

/**
 * Query Claude for knowledge
 */
async function queryClaude(query, context) {
  if (!anthropic) {
    console.warn('[Atlas] Claude not available - ANTHROPIC_API_KEY not configured');
    return {
      source: 'claude',
      success: false,
      error: 'Anthropic API key not configured'
    };
  }

  try {
    console.log('[Atlas] Querying Claude...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are Atlas, a knowledge engine. Provide accurate, concise, actionable information.
Context: ${context || 'general business inquiry'}

Rules:
- Be factual and cite sources when possible
- Keep responses focused and practical
- If you don't know something, say so
- Provide specific, actionable insights`,
      messages: [{
        role: 'user',
        content: query
      }]
    });

    return {
      source: 'claude',
      content: response.content[0].text,
      success: true
    };
  } catch (error) {
    console.error('[Atlas] Claude error:', error.message);
    return { source: 'claude', success: false, error: error.message };
  }
}

/**
 * Query OpenAI GPT-4 for knowledge
 */
async function queryOpenAI(query, context) {
  if (!openai) {
    return { source: 'openai', success: false, error: 'OpenAI not configured' };
  }

  try {
    console.log('[Atlas] Querying OpenAI...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are Atlas, a knowledge engine. Provide accurate, concise, actionable information.
Context: ${context || 'general business inquiry'}

Rules:
- Be factual and cite sources when possible
- Keep responses focused and practical
- If you don't know something, say so
- Provide specific, actionable insights`
        },
        {
          role: 'user',
          content: query
        }
      ]
    });

    return {
      source: 'openai',
      content: response.choices[0].message.content,
      success: true
    };
  } catch (error) {
    console.error('[Atlas] OpenAI error:', error.message);
    return { source: 'openai', success: false, error: error.message };
  }
}

/**
 * Query Perplexity for real-time web search
 */
async function queryPerplexity(query, context) {
  if (!perplexity) {
    return { source: 'perplexity', success: false, error: 'Perplexity not configured' };
  }

  try {
    console.log('[Atlas] Querying Perplexity...');

    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-large-128k-online',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are Atlas, a knowledge engine with real-time web access.
Context: ${context || 'general business inquiry'}
Provide current, accurate information with citations.`
        },
        {
          role: 'user',
          content: query
        }
      ]
    });

    return {
      source: 'perplexity',
      content: response.choices[0].message.content,
      citations: response.citations || [],
      success: true
    };
  } catch (error) {
    console.error('[Atlas] Perplexity error:', error.message);
    return { source: 'perplexity', success: false, error: error.message };
  }
}

/**
 * Query Google Gemini for knowledge (FREE tier available)
 */
async function queryGemini(query, context) {
  if (!gemini) {
    return { source: 'gemini', success: false, error: 'Gemini not configured' };
  }

  try {
    console.log('[Atlas] Querying Gemini...');

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are Atlas, a knowledge engine. Provide accurate, concise, actionable information.
Context: ${context || 'general business inquiry'}

Rules:
- Be factual and cite sources when possible
- Keep responses focused and practical
- If you don't know something, say so
- Provide specific, actionable insights

Question: ${query}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      source: 'gemini',
      content: text,
      success: true
    };
  } catch (error) {
    console.error('[Atlas] Gemini error:', error.message);
    return { source: 'gemini', success: false, error: error.message };
  }
}

// ============================================
// MEMORY FUNCTIONS
// ============================================

/**
 * Check if we have this knowledge cached in memory
 */
async function checkMemory(query, tenantId, context) {
  try {
    // Create a simple query key from the question
    const queryKey = query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 5)
      .join('_');

    // Search for similar knowledge in memory
    const { data: memories } = await db
      .from('ai_memory_store')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category', context || 'general')
      .ilike('key', `%${queryKey}%`)
      .order('last_updated', { ascending: false })
      .limit(3);

    if (memories && memories.length > 0) {
      // Check if memory is fresh (less than 7 days old)
      const freshMemory = memories.find(m => {
        const daysSinceUpdate = (Date.now() - new Date(m.last_updated).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate < 7;
      });

      if (freshMemory) {
                return {
          found: true,
          memory: freshMemory,
          content: typeof freshMemory.value === 'object'
            ? freshMemory.value.content || JSON.stringify(freshMemory.value)
            : freshMemory.value
        };
      }
    }

    return { found: false };
  } catch (error) {
    console.error('[Atlas] Memory check error:', error.message);
    return { found: false };
  }
}

/**
 * Save new knowledge to memory
 */
async function saveToMemory(query, answer, tenantId, context, sources) {
  try {
    // Create a key from the query
    const queryKey = query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 5)
      .join('_');

    const memoryKey = `atlas_${queryKey}_${Date.now()}`;

    const { error } = await db
      .from('ai_memory_store')
      .upsert({
        tenant_id: tenantId,
        category: context || 'general',
        subcategory: 'atlas_learned',
        key: memoryKey,
        value: {
          question: query,
          content: answer,
          sources: sources,
          learned_at: new Date().toISOString()
        },
        content_type: 'json',
        last_updated: new Date().toISOString(),
        verified_by: 'Atlas',
        version: 1,
        tags: ['atlas', 'learned', context || 'general']
      }, {
        onConflict: 'tenant_id,category,key'
      });

    if (error) {
      console.error('[Atlas] Failed to save memory:', error);
      return false;
    }

    console.log('[Atlas] Saved to memory:', memoryKey);
    return true;
  } catch (error) {
    console.error('[Atlas] Save memory error:', error.message);
    return false;
  }
}

/**
 * Synthesize multiple source responses into one answer
 */
async function synthesizeResponses(query, responses, context) {
  // Filter successful responses
  const validResponses = responses.filter(r => r.success);

  if (validResponses.length === 0) {
    return {
      success: false,
      error: 'All knowledge sources failed'
    };
  }

  // If only one response, return it directly
  if (validResponses.length === 1) {
    return {
      success: true,
      answer: validResponses[0].content,
      sources: [validResponses[0].source],
      confidence: 0.8
    };
  }

  // Synthesize multiple responses using Claude
  try {
    const sourceTexts = validResponses.map(r =>
      `### ${r.source.toUpperCase()}:\n${r.content}`
    ).join('\n\n');

    const synthesisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are Atlas, synthesizing knowledge from multiple AI sources.
Create a single, comprehensive answer that:
- Combines the best insights from each source
- Resolves any contradictions (favor more recent/cited information)
- Is concise and actionable
- Notes where sources agree (higher confidence)`,
      messages: [{
        role: 'user',
        content: `Question: ${query}

Sources:
${sourceTexts}

Synthesize into one clear, actionable answer:`
      }]
    });

    return {
      success: true,
      answer: synthesisResponse.content[0].text,
      sources: validResponses.map(r => r.source),
      confidence: validResponses.length >= 2 ? 0.95 : 0.85
    };
  } catch (error) {
    // Fallback to first response if synthesis fails
    return {
      success: true,
      answer: validResponses[0].content,
      sources: [validResponses[0].source],
      confidence: 0.75
    };
  }
}

// ============================================
// MAIN API HANDLER
// ============================================

async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://growthmanagerpro.com',
    'https://www.growthmanagerpro.com',
    'http://localhost:3000'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Restrict direct API access to Maggie only (bots use queryAtlas function internally)
    if (req.user && req.user.email !== 'maggie@maggieforbesstrategies.com') {
      return res.status(403).json({
        success: false,
        error: 'Atlas direct access is restricted to Maggie Forbes. Bots access Atlas through internal functions.'
      });
    }

    const {
      query,
      context = 'general',
      sources = ['gemini'],  // Which sources to use: gemini (default, free tier), perplexity, claude, openai
      save_to_memory = true,
      tenantId,
      calledBy = 'direct'  // Which bot is calling
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';

    console.log(`[Atlas] Query from ${calledBy}: "${query.substring(0, 50)}..."`);
    console.log(`[Atlas] Context: ${context}, Sources: ${sources.join(', ')}`);

    // Step 1: Check memory first
    const memoryCheck = await checkMemory(query, effectiveTenantId, context);

    if (memoryCheck.found) {
      console.log('[Atlas] Returning cached knowledge');
      return res.status(200).json({
        success: true,
        answer: memoryCheck.content,
        sources: ['memory'],
        from_memory: true,
        memory_key: memoryCheck.memory.key,
        confidence: 0.9
      });
    }

    // Step 2: Query requested sources in parallel - Gemini first (free tier)
    const sourcePromises = [];

    if (sources.includes('gemini')) {
      sourcePromises.push(queryGemini(query, context));
    }
    if (sources.includes('perplexity')) {
      sourcePromises.push(queryPerplexity(query, context));
    }
    if (sources.includes('claude')) {
      sourcePromises.push(queryClaude(query, context));
    }
    if (sources.includes('openai')) {
      sourcePromises.push(queryOpenAI(query, context));
    }

    // Default to Gemini if no sources specified (free tier)
    if (sourcePromises.length === 0) {
      sourcePromises.push(queryGemini(query, context));
    }

    const responses = await Promise.all(sourcePromises);

    // Step 3: Synthesize responses
    const result = await synthesizeResponses(query, responses, context);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get knowledge'
      });
    }

    // Step 4: Save to memory if requested
    let savedToMemory = false;
    if (save_to_memory && result.success) {
      savedToMemory = await saveToMemory(
        query,
        result.answer,
        effectiveTenantId,
        context,
        result.sources
      );
    }

    console.log(`[Atlas] Success - Sources: ${result.sources.join(', ')}, Saved: ${savedToMemory}`);

    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      from_memory: false,
      saved_to_memory: savedToMemory
    });

  } catch (error) {
    console.error('[Atlas] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Atlas encountered an error processing your query',
      details: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION FOR BOTS TO CALL ATLAS
// ============================================

/**
 * Helper function that bots can import to query Atlas
 *
 * Usage in bot files:
 * const { queryAtlas } = require('./atlas-knowledge');
 * const result = await queryAtlas('What are B2B marketing trends?', 'marketing', tenantId);
 */
async function queryAtlas(query, context = 'general', tenantId = '00000000-0000-0000-0000-000000000001', options = {}) {
  const {
    sources = ['gemini'], // Use Gemini first (free tier)
    save_to_memory = true,
    calledBy = 'bot'
  } = options;

  // Check memory first
  const memoryCheck = await checkMemory(query, tenantId, context);
  if (memoryCheck.found) {
    return {
      success: true,
      answer: memoryCheck.content,
      sources: ['memory'],
      from_memory: true
    };
  }

  // Query sources - Only add if configured
  const sourcePromises = [];
  if (sources.includes('gemini') && gemini) sourcePromises.push(queryGemini(query, context));
  if (sources.includes('perplexity') && perplexity) sourcePromises.push(queryPerplexity(query, context));
  if (sources.includes('claude') && anthropic) sourcePromises.push(queryClaude(query, context));
  if (sources.includes('openai') && openai) sourcePromises.push(queryOpenAI(query, context));

  // Fallback: try Gemini first (free tier), then Claude if Gemini not configured
  if (sourcePromises.length === 0) {
    if (gemini) {
      sourcePromises.push(queryGemini(query, context));
    } else if (anthropic) {
      sourcePromises.push(queryClaude(query, context));
    } else {
      return {
        success: false,
        error: 'No AI sources configured. Please set GOOGLE_AI_API_KEY or ANTHROPIC_API_KEY.'
      };
    }
  }

  const responses = await Promise.all(sourcePromises);
  const result = await synthesizeResponses(query, responses, context);

  if (result.success && save_to_memory) {
    await saveToMemory(query, result.answer, tenantId, context, result.sources);
  }

  return result;
}

// Export with authentication wrapper
// Apply validation before authentication
const validatedHandler = async (req, res) => {
  // Apply CSRF protection for state-changing methods
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    await new Promise((resolve, reject) => {
      csrfMiddleware()(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // If CSRF check failed, response is already sent
    if (res.headersSent) return;
  }
  // Run validation
  await new Promise((resolve, reject) => {
    validateInput(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // If validation failed, response is already sent
  if (res.headersSent) return;

  // Call original handler with validated data
  return handler(req, res);
};

module.exports = withAuth(validatedHandler);

// Export queryAtlas for bots to use
module.exports.queryAtlas = queryAtlas;