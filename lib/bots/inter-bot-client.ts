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

/**
 * ========================================================
 * C-SUITE REPORTING FUNCTIONS
 * All operational bots report to MFS C-Suite Bot
 * ========================================================
 */

type BotName = 'atlas' | 'annie' | 'henry' | 'dave' | 'dan' | 'jordan';
type ReportType =
  | 'daily_summary'
  | 'action_completed'
  | 'bot_failure'
  | 'metric_update'
  | 'alert'
  | 'status_change';
type Priority = 'normal' | 'high' | 'urgent' | 'critical';

interface CSuiteReportRequest {
  reporting_bot: BotName;
  report_type: ReportType;
  data: any;
  priority?: Priority;
}

interface CSuiteReportResponse {
  success: boolean;
  result?: {
    report_id: string;
    requires_immediate_action: boolean;
  };
  error?: string;
}

interface CSuiteDirective {
  id: string;
  target_bot: string | null;
  action_type: string;
  action_data: any;
  status: string;
  priority: Priority;
  created_at: string;
}

/**
 * Report to MFS C-Suite Bot
 * All operational bots should use this to report their activities
 */
export async function reportToCSuite(
  reporting_bot: BotName,
  report_type: ReportType,
  data: any,
  priority: Priority = 'normal'
): Promise<CSuiteReportResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/bots/mfs-csuite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'receive_report',
        report_data: {
          reporting_bot,
          report_type,
          data,
          priority
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `C-Suite report failed with status ${response.status}`);
    }

    const result: CSuiteReportResponse = await response.json();

    console.log(`[InterBot] ${reporting_bot} reported to C-Suite: ${report_type} (${priority})`);

    return result;

  } catch (error: any) {
    console.error(`[InterBot] Failed to report to C-Suite:`, error);
    return {
      success: false,
      error: error.message || 'Failed to communicate with C-Suite'
    };
  }
}

/**
 * Send a daily summary report to C-Suite
 */
export async function reportDailySummary(
  reporting_bot: BotName,
  summary: {
    actions_completed: number;
    success_rate: number;
    key_metrics: Record<string, any>;
    issues?: string[];
    highlights?: string[];
  }
): Promise<CSuiteReportResponse> {
  return reportToCSuite(
    reporting_bot,
    'daily_summary',
    summary,
    'normal'
  );
}

/**
 * Report a completed action to C-Suite
 */
export async function reportActionCompleted(
  reporting_bot: BotName,
  action: {
    action_type: string;
    details: any;
    success: boolean;
    metrics?: Record<string, any>;
  }
): Promise<CSuiteReportResponse> {
  return reportToCSuite(
    reporting_bot,
    'action_completed',
    action,
    'normal'
  );
}

/**
 * Report a critical issue/failure to C-Suite
 */
export async function reportCriticalIssue(
  reporting_bot: BotName,
  issue: {
    error_type: string;
    error_message: string;
    affected_systems?: string[];
    recovery_attempted?: boolean;
    requires_human_intervention?: boolean;
  },
  priority: 'urgent' | 'critical' = 'urgent'
): Promise<CSuiteReportResponse> {
  return reportToCSuite(
    reporting_bot,
    'alert',
    issue,
    priority
  );
}

/**
 * Report a metric update to C-Suite
 */
export async function reportMetricUpdate(
  reporting_bot: BotName,
  metrics: {
    metric_name: string;
    current_value: number;
    previous_value?: number;
    threshold?: number;
    status?: 'normal' | 'warning' | 'critical';
  }
): Promise<CSuiteReportResponse> {
  const priority = metrics.status === 'critical' ? 'high' : 'normal';

  return reportToCSuite(
    reporting_bot,
    'metric_update',
    metrics,
    priority
  );
}

/**
 * Get pending directives from C-Suite for this bot
 */
export async function getCSuiteDirectives(
  bot_name: BotName
): Promise<{ success: boolean; directives?: CSuiteDirective[]; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // This would query the csuite_actions table for directives targeting this bot
    // For now, we'll implement a basic version that bots can call periodically

    console.log(`[InterBot] ${bot_name} checking for C-Suite directives...`);

    // TODO: Implement GET endpoint on C-Suite bot to fetch directives
    // For now, return empty array

    return {
      success: true,
      directives: []
    };

  } catch (error: any) {
    console.error(`[InterBot] Failed to get C-Suite directives:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get directives from C-Suite'
    };
  }
}
