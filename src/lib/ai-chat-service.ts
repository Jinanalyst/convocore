// AI Chat Service for Voice Integration
export class AIChatService {
  
  async generateResponse(prompt: string): Promise<string> {
    try {
      // For now, we'll simulate an AI response
      // In a real implementation, this would call your AI service (OpenAI, Anthropic, etc.)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Generate a mock response based on the prompt
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's my thoughts on that topic:",
        "Great question! Based on what you've said, I would suggest:",
        "I can help you with that. Let me provide some insights:",
        "That's a thoughtful inquiry. Here's what I think about it:"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Add some context based on the prompt
      let contextualResponse = "";
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
        contextualResponse = "Hello! It's great to meet you. How can I assist you today?";
      } else if (lowerPrompt.includes('help')) {
        contextualResponse = "I'm here to help! What specifically would you like assistance with?";
      } else if (lowerPrompt.includes('weather')) {
        contextualResponse = "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for current conditions in your area.";
      } else if (lowerPrompt.includes('time')) {
        contextualResponse = `The current time is ${new Date().toLocaleTimeString()}.`;
      } else if (lowerPrompt.includes('code') || lowerPrompt.includes('programming')) {
        contextualResponse = "I'd be happy to help with coding questions! What programming language or concept would you like to discuss?";
      } else {
        contextualResponse = `${randomResponse} Regarding "${prompt}", I think this is a topic worth exploring further. Would you like me to elaborate on any particular aspect?`;
      }
      
      // Trigger notification when user is away from page
      if (typeof window !== 'undefined' && document.hidden) {
        // Import notification service dynamically to avoid SSR issues
        import('./notification-service').then(({ notificationService }) => {
          notificationService.notifyChatComplete(
            'Chat Response Ready',
            contextualResponse.slice(0, 100) + (contextualResponse.length > 100 ? '...' : ''),
            undefined // chatId would be passed from the calling component
          );
        });
      }

      return contextualResponse;
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }
  }

  async submitToRealAI(prompt: string, model: string = 'gpt-4o'): Promise<string> {
    try {
      // Map Convocore model names to actual API model IDs
      const modelMapping: { [key: string]: string } = {
        'gpt-4o': 'gpt-4o',
        'gpt-4-turbo': 'gpt-4-turbo',
        'claude-3-opus-20240229': 'claude-3-opus-20240229',
        'claude-3-sonnet-20240229': 'claude-3-sonnet-20240229'
      };

      const apiModel = modelMapping[model] || model;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          model: apiModel,
          conversationId: null, // for voice, we'll use a new conversation each time
          stream: false // ensure we get a complete response for voice
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different possible response formats
      if (data.response) {
        return data.response;
      } else if (data.message) {
        return data.message;
      } else if (data.content) {
        return data.content;
      } else if (typeof data === 'string') {
        return data;
      } else {
        throw new Error('Unexpected response format from AI API');
      }
      
    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // Enhanced fallback with error context
      if (error instanceof Error && error.message.includes('fetch')) {
        return "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again.";
      } else if (error instanceof Error && error.message.includes('status')) {
        return "The AI service is temporarily unavailable. Please try again in a moment.";
      } else {
        // Fallback to enhanced mock response
        return this.generateEnhancedResponse(prompt, model);
      }
    }
  }

  private async generateEnhancedResponse(prompt: string, model: string): Promise<string> {
    // Enhanced fallback response that considers the selected model
    const modelNames: { [key: string]: string } = {
      'gpt-4o': 'Convocore Omni',
      'gpt-4-turbo': 'Convocore Turbo', 
      'claude-3-opus-20240229': 'Convocore Alpha',
      'claude-3-sonnet-20240229': 'Convocore Nova'
    };
    
    const modelName = modelNames[model] || 'Convocore';
    
         const modelSpecificResponses: { [key: string]: string } = {
       'gpt-4o': "As your flagship AI assistant, I can help with multimodal tasks, complex reasoning, and provide comprehensive responses.",
       'gpt-4-turbo': "I'm optimized for speed and efficiency. Let me quickly process your request and provide a helpful response.",
       'claude-3-opus-20240229': "I excel at deep analysis and complex reasoning. Let me thoughtfully consider your question and provide a detailed response.",
       'claude-3-sonnet-20240229': "I'm designed for practical, everyday assistance. Let me help you with a balanced and useful response."
     };

    const modelIntro = modelSpecificResponses[model] || "I'm here to help you.";
    const baseResponse = await this.generateResponse(prompt);
    
    return `${modelIntro} ${baseResponse}`;
  }
}

// Create a singleton instance
export const aiChatService = new AIChatService(); 