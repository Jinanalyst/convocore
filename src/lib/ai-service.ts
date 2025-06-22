import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Convocore model configurations
export const AI_MODELS = {
  'gpt-4o': {
    provider: 'openai' as const,
    name: 'Convocore Omni',
    description: 'Flagship model, multimodal, high performance, fast',
    maxTokens: 4096,
    contextLength: 128000,
  },
  'gpt-4-turbo': {
    provider: 'openai' as const,
    name: 'Convocore Turbo',
    description: 'High-speed response + quality balance, code/text optimization',
    maxTokens: 4096,
    contextLength: 128000,
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic' as const,
    name: 'Convocore Alpha',
    description: 'Most precise reasoning ability, long-form writing, advanced analysis',
    maxTokens: 4096,
    contextLength: 200000,
  },
  'claude-3-sonnet-20240229': {
    provider: 'anthropic' as const,
    name: 'Convocore Nova',
    description: 'Balanced performance, fast response, suitable for practical daily tasks',
    maxTokens: 4096,
    contextLength: 200000,
  },
} as const;

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Anthropic client initialization
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function sendChatMessage(
  messages: ChatMessage[],
  config: AIServiceConfig
): Promise<ChatResponse> {
  const { provider, model, temperature = 0.7, maxTokens = 2048, stream = false } = config;

  try {
    if (provider === 'openai') {
      return await sendOpenAIMessage(messages, model, temperature, maxTokens, stream);
    } else if (provider === 'anthropic') {
      return await sendAnthropicMessage(messages, model, temperature, maxTokens);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to get AI response');
  }
}

async function sendOpenAIMessage(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
): Promise<ChatResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await openai.chat.completions.create({
    model,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature,
    max_tokens: maxTokens,
    stream: false, // For now, we'll handle streaming separately
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error('No response from OpenAI');
  }

  return {
    content: choice.message.content,
    model,
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    } : undefined,
  };
}

async function sendAnthropicMessage(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<ChatResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert our message format to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await anthropic.messages.create({
    model: model.replace('claude-3-', 'claude-3-'), // Ensure correct model name format
    max_tokens: maxTokens,
    temperature,
    system: systemMessage?.content,
    messages: conversationMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  return {
    content: content.text,
    model,
    usage: response.usage ? {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    } : undefined,
  };
}

// Utility function to get model configuration
export async function getModelConfig(modelId: string): Promise<(typeof AI_MODELS)[keyof typeof AI_MODELS] | null> {
  return AI_MODELS[modelId as keyof typeof AI_MODELS] || null;
}

// Utility function to validate API keys
export async function validateAPIKeys(): Promise<{ openai: boolean; anthropic: boolean }> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}

// Main AI Service Instance
export const aiService = {
  async generateResponse(messages: ChatMessage[], model: string = 'gpt-4o'): Promise<string> {
    const modelConfig = await getModelConfig(model);
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const config: AIServiceConfig = {
      provider: modelConfig.provider,
      model: model,
      temperature: 0.7,
      maxTokens: modelConfig.maxTokens,
      stream: false
    };

    const response = await sendChatMessage(messages, config);
    return response.content;
  },

  async getAvailableModels() {
    return AI_MODELS;
  },

  async validateConfiguration() {
    return await validateAPIKeys();
  }
}; 