/**
 * Inter-Bot Communication Client
 * Allows all bots to communicate with each other, primarily to query Atlas for research
 */

interface AtlasResearchRequest {
  requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan';
  research_topic: string;
  context?: string;
  max_tokens?: number;
  prefer_provider?: 'bedrock' | 'anthropic' | 'openai';
}

interface AtlasResearchResponse {
  success: boolean;
  research_result?: string;
  model_used?: string;
  cost?: number;
  provider?: string;
  error?: string;
  action_log_id?: string;
}

export class InterBotClient {
  private baseUrl: string;

  constructor() {
    // Use internal URL for server-side bot communication
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Query Atlas for research
   * @param request - Research request parameters
   * @returns Research results from Atlas
   */
  async queryAtlas(request: AtlasResearchRequest): Promise<AtlasResearchResponse> {
    try {
      console.log(`[InterBot] ${request.requesting_bot} querying Atlas: "${request.research_topic}"`);

      const response = await fetch(`${this.baseUrl}/api/bots/atlas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Atlas query failed with status ${response.status}`);
      }

      const data: AtlasResearchResponse = await response.json();

      if (data.success && data.research_result) {
        console.log(`[InterBot] Atlas responded to ${request.requesting_bot} (${data.provider}, $${data.cost?.toFixed(6) || 0})`);
      }

      return data;

    } catch (error: any) {
      console.error(`[InterBot] Failed to query Atlas:`, error);
      return {
        success: false,
        error: error.message || 'Failed to communicate with Atlas'
      };
    }
  }

  /**
   * Get Atlas bot status
   */
  async getAtlasStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/atlas`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Status check failed with status ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('[InterBot] Failed to get Atlas status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper method: Quick research query (uses defaults)
   */
  async quickResearch(
    requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan',
    research_topic: string
  ): Promise<string | null> {
    const response = await this.queryAtlas({
      requesting_bot,
      research_topic,
      max_tokens: 512 // Shorter for quick queries
    });

    return response.success ? response.research_result || null : null;
  }

  /**
   * Helper method: Deep research query (more tokens, prefer quality)
   */
  async deepResearch(
    requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan',
    research_topic: string,
    context?: string
  ): Promise<string | null> {
    const response = await this.queryAtlas({
      requesting_bot,
      research_topic,
      context,
      max_tokens: 2048, // Longer for deep research
      prefer_provider: 'anthropic' // Use higher quality model
    });

    return response.success ? response.research_result || null : null;
  }

  /**
   * Helper method: Cost-optimized research (prefers AWS Bedrock)
   */
  async costOptimizedResearch(
    requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan',
    research_topic: string,
    context?: string
  ): Promise<string | null> {
    const response = await this.queryAtlas({
      requesting_bot,
      research_topic,
      context,
      max_tokens: 1024,
      prefer_provider: 'bedrock' // Explicitly prefer cheapest option
    });

    return response.success ? response.research_result || null : null;
  }
}

// Singleton instance
let interBotClientInstance: InterBotClient | null = null;

/**
 * Get the inter-bot client singleton
 */
export function getInterBotClient(): InterBotClient {
  if (!interBotClientInstance) {
    interBotClientInstance = new InterBotClient();
  }
  return interBotClientInstance;
}

/**
 * Convenience function: Query Atlas from any bot
 */
export async function askAtlas(
  requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan',
  research_topic: string,
  options?: {
    context?: string;
    max_tokens?: number;
    prefer_provider?: 'bedrock' | 'anthropic' | 'openai';
  }
): Promise<AtlasResearchResponse> {
  const client = getInterBotClient();
  return client.queryAtlas({
    requesting_bot,
    research_topic,
    ...options
  });
}
