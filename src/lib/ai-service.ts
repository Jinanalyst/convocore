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

  console.log(`📤 Sending message to ${provider} (${model}) with ${messages.length} messages`);

  try {
    if (provider === 'openai') {
      return await sendOpenAIMessage(messages, model, temperature, maxTokens, stream);
    } else if (provider === 'anthropic') {
      return await sendAnthropicMessage(messages, model, temperature, maxTokens);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error('🚨 AI Service Error:', error);
    
    // Re-throw with original error for better debugging
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to get AI response: Unknown error');
    }
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
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.');
  }

  console.log(`🔄 Calling OpenAI API with model: ${model}`);

  try {
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
      throw new Error('No response from OpenAI API');
    }

    console.log('✅ OpenAI response received successfully');

    return {
      content: choice.message.content,
      model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('🚨 OpenAI API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('401')) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local');
      } else if (error.message.includes('429')) {
        throw new Error('OpenAI rate limit exceeded. Please try again later or upgrade your plan.');
      } else if (error.message.includes('404')) {
        throw new Error(`OpenAI model "${model}" not found. Please use a valid model.`);
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    } else {
      throw new Error('Unknown OpenAI API error');
    }
  }
}

async function sendAnthropicMessage(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<ChatResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.');
  }

  console.log(`🔄 Calling Anthropic API with model: ${model}`);

  try {
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
      throw new Error('Unexpected response type from Anthropic API');
    }

    console.log('✅ Anthropic response received successfully');

    return {
      content: content.text,
      model,
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('🚨 Anthropic API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific Anthropic errors
      if (error.message.includes('401')) {
        throw new Error('Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY in .env.local');
      } else if (error.message.includes('429')) {
        throw new Error('Anthropic rate limit exceeded. Please try again later or upgrade your plan.');
      } else if (error.message.includes('404')) {
        throw new Error(`Anthropic model "${model}" not found. Please use a valid model.`);
      } else {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
    } else {
      throw new Error('Unknown Anthropic API error');
    }
  }
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
    console.log('🤖 AI Service - Starting response generation');
    console.log('📊 Config check:', {
      openaiKey: !!process.env.OPENAI_API_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      model: model
    });

    const modelConfig = await getModelConfig(model);
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Check if we have the right API key for the model provider
    if (modelConfig.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.');
    }
    
    if (modelConfig.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.');
    }

    const config: AIServiceConfig = {
      provider: modelConfig.provider,
      model: model,
      temperature: 0.7,
      maxTokens: modelConfig.maxTokens,
      stream: false
    };

    console.log(`🚀 Using ${config.provider} with model ${config.model}`);

    try {
      const response = await sendChatMessage(messages, config);
      console.log('✅ Response generated successfully');
      return response.content;
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error(`Invalid API key for ${config.provider}. Please check your ${config.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}.`);
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        throw new Error(`API quota exceeded for ${config.provider}. Please check your usage limits or upgrade your plan.`);
      } else if (errorMessage.includes('404') || errorMessage.includes('model')) {
        throw new Error(`Model ${model} not available. Please try a different model.`);
      } else {
        throw new Error(`${config.provider} API error: ${errorMessage}`);
      }
    }
  },

  async getAvailableModels() {
    return AI_MODELS;
  },

  async validateConfiguration() {
    const validation = await validateAPIKeys();
    console.log('🔍 API Key Validation:', validation);
    return validation;
  }
}; 