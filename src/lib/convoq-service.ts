export interface ConvoQRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  apiKey?: string;
}

export interface ConvoQResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ConvoQService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GROQ_API_KEY || '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';
  }

  async generateResponse(request: ConvoQRequest): Promise<ConvoQResponse> {
    try {
      if (!this.apiKey && !request.apiKey) {
        throw new Error('Groq API key is required');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.apiKey || this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'llama3-8b-8192',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2048,
          stream: request.stream || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`ConvoQ API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ConvoQ generation error:', error);
      throw error;
    }
  }

  async streamResponse(request: ConvoQRequest): Promise<ReadableStream> {
    try {
      if (!this.apiKey && !request.apiKey) {
        throw new Error('Groq API key is required');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.apiKey || this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'llama3-8b-8192',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2048,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`ConvoQ API error: ${response.status} ${response.statusText}`);
      }

      return response.body!;
    } catch (error) {
      console.error('ConvoQ streaming error:', error);
      throw error;
    }
  }

  // Available ConvoQ models
  static getAvailableModels() {
    return [
      {
        id: 'llama3-8b-8192',
        name: 'Llama 3 8B',
        description: 'Fast and efficient for most tasks',
        contextWindow: 8192,
      },
      {
        id: 'llama3-70b-8192',
        name: 'Llama 3 70B',
        description: 'More capable model for complex reasoning',
        contextWindow: 8192,
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'High-quality mixture of experts model',
        contextWindow: 32768,
      },
      {
        id: 'gemma-7b-it',
        name: 'Gemma 7B',
        description: 'Google\'s lightweight and efficient model',
        contextWindow: 8192,
      },
    ];
  }
}

export const convoQService = new ConvoQService(); 