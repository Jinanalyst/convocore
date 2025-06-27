import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { convoQService } from './convoq-service';

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'groq';
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// User Settings Interface (matching settings modal)
interface UserSettings {
  aiModel: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    streamResponse: boolean;
  };
}

// Function to load user settings from localStorage
function loadUserSettings(): UserSettings {
  try {
    const savedSettings = localStorage.getItem('convocore-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return {
        aiModel: {
          defaultModel: parsed.aiModel?.defaultModel || 'convoq',
          temperature: parsed.aiModel?.temperature ?? 0.7,
          maxTokens: parsed.aiModel?.maxTokens || 2048,
          streamResponse: parsed.aiModel?.streamResponse ?? true
        }
      };
    }
  } catch (error) {
    console.warn('Failed to load user settings:', error);
  }
  
  // Return defaults if loading fails
  return {
    aiModel: {
      defaultModel: 'convoq',
      temperature: 0.7,
      maxTokens: 2048,
      streamResponse: true
    }
  };
}

// Convocore model configurations
export const AI_MODELS = {
  'gpt-4o': {
    provider: 'openai' as const,
    name: 'Convocore Omni',
    description: 'Flagship model, multimodal, high performance, fast',
    maxTokens: 4096,
    contextLength: 128000,
    tier: 'pro' as const, // Paid model
  },
  'gpt-4-turbo': {
    provider: 'openai' as const,
    name: 'Convocore Turbo',
    description: 'High-speed response + quality balance, code/text optimization',
    maxTokens: 4096,
    contextLength: 128000,
    tier: 'pro' as const, // Paid model
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic' as const,
    name: 'Convocore Alpha',
    description: 'Most precise reasoning ability, long-form writing, advanced analysis',
    maxTokens: 4096,
    contextLength: 200000,
    tier: 'premium' as const, // Premium model
  },
  'claude-3-sonnet-20240229': {
    provider: 'anthropic' as const,
    name: 'Convocore Nova',
    description: 'Balanced performance, fast response, suitable for practical daily tasks',
    maxTokens: 4096,
    contextLength: 200000,
    tier: 'pro' as const, // Paid model
  },
  'deepseek/deepseek-r1:free': {
    provider: 'openrouter' as const,
    name: 'ConvoMini',
    description: 'Compact and efficient model for quick responses and daily conversations',
    maxTokens: 4096,
    contextLength: 32000,
    tier: 'free' as const, // Free model
  },
  'convoq': {
    provider: 'groq' as const,
    name: 'ConvoQ',
    description: 'Ultra-fast responses powered by Groq\'s lightning-fast inference',
    maxTokens: 8192,
    contextLength: 8192,
    tier: 'free' as const, // Free model
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

// Initialize OpenRouter client (using OpenAI SDK with custom base URL)
const openrouter = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
}) : null;

// Groq client is handled through the ConvoQ service

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
    } else if (provider === 'openrouter') {
      return await sendOpenRouterMessage(messages, model, temperature, maxTokens);
    } else if (provider === 'groq') {
      return await sendGroqMessage(messages, model, temperature, maxTokens);
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

async function sendOpenRouterMessage(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<ChatResponse> {
  if (!openrouter) {
    throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env.local file.');
  }

  console.log(`🔄 Calling OpenRouter API with model: ${model}`);

  try {
    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: false,
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No response content from OpenRouter API');
    }

    console.log('✅ OpenRouter response received successfully');

    return {
      content: choice.message.content,
      model,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error);
    throw error;
  }
}

async function sendGroqMessage(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<ChatResponse> {
  console.log(`🔄 Calling Groq API (ConvoQ) with model: ${model}`);

  try {
    // Get user settings for API key
    const savedSettings = localStorage.getItem('convocore-settings');
    let apiKey = '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'; // Default API key
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.aiModel?.convoQApiKey) {
          apiKey = settings.aiModel.convoQApiKey;
        }
      } catch (error) {
        console.warn('Failed to parse settings for ConvoQ API key:', error);
      }
    }

    const response = await convoQService.generateResponse({
      messages: messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      model: 'llama3-8b-8192', // Default Groq model
      temperature,
      max_tokens: maxTokens,
      apiKey,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No response content from ConvoQ API');
    }

    console.log('✅ ConvoQ response received successfully');

    return {
      content: choice.message.content,
      model: 'convoq',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('🚨 ConvoQ API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific Groq errors
      if (error.message.includes('401')) {
        throw new Error('Invalid Groq API key. Please check your ConvoQ API key in settings.');
      } else if (error.message.includes('429')) {
        throw new Error('Groq rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`ConvoQ API error: ${error.message}`);
      }
    } else {
      throw new Error('Unknown ConvoQ API error');
    }
  }
}

// Utility function to get model configuration
export async function getModelConfig(modelId: string): Promise<(typeof AI_MODELS)[keyof typeof AI_MODELS] | null> {
  return AI_MODELS[modelId as keyof typeof AI_MODELS] || null;
}

// Get available models based on user tier
export function getAvailableModelsForTier(tier: 'free' | 'pro' | 'premium' = 'free'): Array<{ id: string; name: string; description: string; provider: string; tier: string }> {
  const models = Object.entries(AI_MODELS).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    provider: config.provider,
    tier: config.tier,
  }));

  if (tier === 'free') {
    return models.filter(model => model.tier === 'free');
  } else if (tier === 'pro') {
    return models.filter(model => model.tier === 'free' || model.tier === 'pro');
  } else if (tier === 'premium') {
    return models; // Premium users get access to all models
  }

  return models.filter(model => model.tier === 'free'); // Default to free models
}

// Get default model for tier
export function getDefaultModelForTier(tier: 'free' | 'pro' | 'premium' = 'free'): string {
  if (tier === 'free') {
    return 'convoq'; // Free users get ConvoQ by default
  } else if (tier === 'pro') {
    return 'gpt-4o'; // Pro users get Convocore Omni by default
  } else if (tier === 'premium') {
    return 'claude-3-opus-20240229'; // Premium users get Convocore Alpha by default
  }
  
  return 'convoq'; // Default fallback
}

// Utility function to validate API keys
export async function validateAPIKeys(): Promise<{ openai: boolean; anthropic: boolean; openrouter: boolean; groq: boolean }> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  };
}

// Main AI Service Instance
export const aiService = {
  async generateResponse(messages: ChatMessage[], model: string = 'gpt-4o'): Promise<string> {
    console.log('🤖 AI Service - Starting response generation');
    console.log('📊 Config check:', {
      openaiKey: !!process.env.OPENAI_API_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      openrouterKey: !!process.env.OPENROUTER_API_KEY,
      groqKey: !!process.env.GROQ_API_KEY,
      model: model
    });

    // Load user settings for temperature and maxTokens
    const userSettings = loadUserSettings();
    console.log('⚙️ Using user settings:', {
      temperature: userSettings.aiModel.temperature,
      maxTokens: userSettings.aiModel.maxTokens,
      streamResponse: userSettings.aiModel.streamResponse
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

    if (modelConfig.provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env.local file.');
    }

    if (modelConfig.provider === 'groq') {
      // Check if user has configured ConvoQ API key in settings
      const savedSettings = localStorage.getItem('convocore-settings');
      let hasGroqKey = !!process.env.GROQ_API_KEY;
      
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          hasGroqKey = hasGroqKey || !!settings.aiModel?.convoQApiKey;
        } catch (error) {
          console.warn('Failed to check ConvoQ API key in settings:', error);
        }
      }
      
      if (!hasGroqKey) {
        throw new Error('ConvoQ API key not configured. Please add your Groq API key in settings.');
      }
    }

    const config: AIServiceConfig = {
      provider: modelConfig.provider,
      model: model,
      temperature: userSettings.aiModel.temperature, // Use user's temperature setting
      maxTokens: Math.min(userSettings.aiModel.maxTokens, modelConfig.maxTokens), // Respect model limits
      stream: userSettings.aiModel.streamResponse
    };

    console.log(`🚀 Using ${config.provider} with model ${config.model}`);
    console.log('🎛️ AI Parameters:', {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      stream: config.stream
    });

    const response = await sendChatMessage(messages, config);
    return response.content;
  },

  async getAvailableModels() {
    return AI_MODELS;
  },

  async validateConfiguration() {
    const validation = await validateAPIKeys();
    console.log('�� API Key Validation:', validation);
    return validation;
  }
}; 