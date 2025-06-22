"use server";

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

// Default model configurations
export const AI_MODELS = {
  'gpt-4o': {
    provider: 'openai' as const,
    name: 'GPT-4o',
    description: 'Latest flagship model with multimodal capabilities',
    maxTokens: 4096,
    contextLength: 128000,
  },
  'gpt-4-turbo': {
    provider: 'openai' as const,
    name: 'GPT-4 Turbo',
    description: 'Balanced model for complex tasks with good speed',
    maxTokens: 4096,
    contextLength: 128000,
  },
  'gpt-3.5-turbo': {
    provider: 'openai' as const,
    name: 'GPT-3.5 Turbo',
    description: 'Fast, cost-effective model for simple tasks',
    maxTokens: 4096,
    contextLength: 16000,
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic' as const,
    name: 'Claude 3 Opus',
    description: 'Most powerful model for highly complex reasoning tasks',
    maxTokens: 4096,
    contextLength: 200000,
  },
  'claude-3-sonnet-20240229': {
    provider: 'anthropic' as const,
    name: 'Claude 3 Sonnet',
    description: 'Balanced model with excellent performance and speed',
    maxTokens: 4096,
    contextLength: 200000,
  },
  'claude-3-haiku-20240307': {
    provider: 'anthropic' as const,
    name: 'Claude 3 Haiku',
    description: 'Fastest model for quick tasks and high throughput',
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