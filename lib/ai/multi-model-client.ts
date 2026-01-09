/**
 * Multi-Model AI Client
 * Supports AWS Bedrock, Anthropic Claude, and OpenAI
 * Auto-selects cheapest available model for cost optimization
 */

import Anthropic from '@anthropic-ai/sdk';

// AWS Bedrock Client (will use AWS SDK when configured)
interface BedrockConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  model: string;
  cost: number; // Estimated cost in dollars
  provider: 'bedrock' | 'anthropic' | 'openai';
}

export class MultiModelAIClient {
  private anthropic: Anthropic | null = null;
  private bedrockEnabled: boolean = false;
  private openaiEnabled: boolean = false;

  constructor() {
    // Initialize Anthropic if key exists
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here') {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    // Check if Bedrock is configured
    this.bedrockEnabled = !!(
      process.env.AWS_BEDROCK_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );

    // Check if OpenAI is configured
    this.openaiEnabled = !!(process.env.OPENAI_API_KEY);
  }

  /**
   * Generate AI response using the cheapest available model
   */
  async generateResponse(
    messages: AIMessage[],
    options?: {
      preferProvider?: 'bedrock' | 'anthropic' | 'openai';
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<AIResponse> {
    const maxTokens = options?.maxTokens || 1024;
    const temperature = options?.temperature || 0.7;

    // Try providers in cost order: Bedrock (cheapest) → OpenAI → Anthropic
    const providers = this.getProviderPriority(options?.preferProvider);

    for (const provider of providers) {
      try {
        switch (provider) {
          case 'bedrock':
            if (this.bedrockEnabled) {
              return await this.callBedrock(messages, maxTokens, temperature);
            }
            break;

          case 'openai':
            if (this.openaiEnabled) {
              return await this.callOpenAI(messages, maxTokens, temperature);
            }
            break;

          case 'anthropic':
            if (this.anthropic) {
              return await this.callAnthropic(messages, maxTokens, temperature);
            }
            break;
        }
      } catch (error) {
        console.error(`[MultiModelAI] ${provider} failed:`, error);
        // Continue to next provider
      }
    }

    throw new Error('No AI providers available. Please configure AWS Bedrock, Anthropic, or OpenAI.');
  }

  /**
   * Call AWS Bedrock (cheapest option)
   * Using Claude 3 Haiku via Bedrock: ~$0.00025 per 1K tokens
   */
  private async callBedrock(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    try {
      // Dynamic import to avoid errors if SDK not installed
      const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');

      const client = new BedrockRuntimeClient({
        region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      });

      // Convert messages to Claude format
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        temperature,
        system: systemMessage,
        messages: conversationMessages
      };

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      const content = responseBody.content[0].text;
      const inputTokens = responseBody.usage.input_tokens;
      const outputTokens = responseBody.usage.output_tokens;
      const cost = ((inputTokens + outputTokens) / 1000) * 0.00025;

      console.log(`[Bedrock] Successfully called Claude 3 Haiku - Cost: $${cost.toFixed(6)}`);

      return {
        content,
        model: 'claude-3-haiku-20240307-bedrock',
        cost,
        provider: 'bedrock'
      };
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('AWS Bedrock SDK not installed. Run: npm install @aws-sdk/client-bedrock-runtime');
      }
      throw error;
    }
  }

  /**
   * Call OpenAI (medium cost)
   * GPT-3.5-turbo: ~$0.0015 per 1K tokens
   */
  private async callOpenAI(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    try {
      // Dynamic import to avoid errors if SDK not installed
      const OpenAI = (await import('openai')).default;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Convert messages to OpenAI format
      const openaiMessages = messages.map(m => ({
        role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages as any,
        max_tokens: maxTokens,
        temperature
      });

      const content = response.choices[0].message.content || '';
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = ((inputTokens + outputTokens) / 1000) * 0.0015;

      console.log(`[OpenAI] Successfully called GPT-3.5-turbo - Cost: $${cost.toFixed(6)}`);

      return {
        content,
        model: 'gpt-3.5-turbo',
        cost,
        provider: 'openai'
      };
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('OpenAI SDK not installed. Run: npm install openai');
      }
      throw error;
    }
  }

  /**
   * Call Anthropic Claude (highest quality, higher cost)
   * Claude 3 Haiku: ~$0.00025 per 1K tokens
   * Claude 3 Sonnet: ~$0.003 per 1K tokens
   */
  private async callAnthropic(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured');
    }

    // Convert messages to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Cheapest Claude model
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: conversationMessages
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Estimate cost (Claude 3 Haiku: $0.00025 per 1K tokens)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = ((inputTokens + outputTokens) / 1000) * 0.00025;

    return {
      content,
      model: 'claude-3-haiku-20240307',
      cost,
      provider: 'anthropic'
    };
  }

  /**
   * Get provider priority based on cost and preference
   */
  private getProviderPriority(preferProvider?: 'bedrock' | 'anthropic' | 'openai'): Array<'bedrock' | 'anthropic' | 'openai'> {
    if (preferProvider) {
      // Put preferred provider first, then others by cost
      const others = (['bedrock', 'openai', 'anthropic'] as const).filter(p => p !== preferProvider);
      return [preferProvider, ...others];
    }

    // Default: cheapest first
    return ['bedrock', 'anthropic', 'openai'];
  }

  /**
   * Check which providers are available
   */
  getAvailableProviders(): string[] {
    const available: string[] = [];
    if (this.bedrockEnabled) available.push('bedrock (cheapest)');
    if (this.anthropic) available.push('anthropic');
    if (this.openaiEnabled) available.push('openai');
    return available;
  }

  /**
   * Get cost estimate for a request
   */
  estimateCost(inputTokens: number, outputTokens: number, provider: 'bedrock' | 'anthropic' | 'openai'): number {
    const totalTokens = inputTokens + outputTokens;
    const per1k = totalTokens / 1000;

    switch (provider) {
      case 'bedrock':
        return per1k * 0.00025; // Claude 3 Haiku via Bedrock
      case 'anthropic':
        return per1k * 0.00025; // Claude 3 Haiku direct
      case 'openai':
        return per1k * 0.0015; // GPT-3.5-turbo
      default:
        return 0;
    }
  }
}

// Singleton instance
let aiClientInstance: MultiModelAIClient | null = null;

export function getAIClient(): MultiModelAIClient {
  if (!aiClientInstance) {
    aiClientInstance = new MultiModelAIClient();
  }
  return aiClientInstance;
}
