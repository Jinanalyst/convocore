export interface ConvoArtRequest {
  text: string;
  apiKey?: string;
}

export interface ConvoArtResponse {
  id: string;
  output_url: string;
  status: string;
  error?: string;
}

export class ConvoArtService {
  private apiKey: string;
  private baseUrl = 'https://api.deepai.org/api/text2img';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_DEEPAI_API_KEY || '9475df54-f35e-4f20-ae0c-95e99c6c54f3';
  }

  async generateImage(request: ConvoArtRequest): Promise<ConvoArtResponse> {
    try {
      if (!this.apiKey && !request.apiKey) {
        throw new Error('DeepAI API key is required');
      }

      const formData = new FormData();
      formData.append('text', request.text);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'api-key': request.apiKey || this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ConvoArt API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id || Date.now().toString(),
        output_url: data.output_url,
        status: 'completed',
      };
    } catch (error) {
      console.error('ConvoArt generation error:', error);
      return {
        id: Date.now().toString(),
        output_url: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateImageFromFile(file: File, apiKey?: string): Promise<ConvoArtResponse> {
    try {
      if (!this.apiKey && !apiKey) {
        throw new Error('DeepAI API key is required');
      }

      const formData = new FormData();
      formData.append('text', file);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey || this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ConvoArt API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id || Date.now().toString(),
        output_url: data.output_url,
        status: 'completed',
      };
    } catch (error) {
      console.error('ConvoArt file generation error:', error);
      return {
        id: Date.now().toString(),
        output_url: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const convoArtService = new ConvoArtService(); 