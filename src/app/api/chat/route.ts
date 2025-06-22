import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, getModelConfig, type ChatMessage, type AIServiceConfig } from '@/lib/ai-service';
import { detectAgentFromMessage } from '@/lib/model-agents';

// Simple language detection function
function detectLanguage(text: string): string {
  // Korean character detection
  const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  if (koreanRegex.test(text)) {
    return 'ko';
  }
  
  // Default to English
  return 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, temperature, maxTokens }: {
      messages: ChatMessage[];
      model: string;
      temperature?: number;
      maxTokens?: number;
    } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // Get model configuration
    const modelConfig = await getModelConfig(model);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Unsupported model: ${model}` },
        { status: 400 }
      );
    }

    // Check for agent mentions in the latest user message
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    let processedMessages = [...messages];

    if (latestUserMessage) {
      // Detect language from user's message
      const detectedLanguage = detectLanguage(latestUserMessage.content);
      
      // Create language instruction
      const languageInstruction = detectedLanguage === 'ko' 
        ? 'Please respond in Korean (한국어). Use natural Korean expressions and grammar.'
        : 'Please respond in English. Use clear and natural English expressions.';

      const detectedAgent = detectAgentFromMessage(latestUserMessage.content);
      
      if (detectedAgent) {
        // Add or update system message with agent's system prompt + language instruction
        const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
        const agentSystemMessage: ChatMessage = {
          role: 'system',
          content: `${detectedAgent.systemPrompt}\n\n${languageInstruction}`
        };

        if (systemMessageIndex >= 0) {
          // Replace existing system message
          processedMessages[systemMessageIndex] = agentSystemMessage;
        } else {
          // Add system message at the beginning
          processedMessages.unshift(agentSystemMessage);
        }

        console.log(`Agent detected: ${detectedAgent.tag} - ${detectedAgent.displayName}, Language: ${detectedLanguage}`);
      } else {
        // Add language instruction even without agent
        const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
        const languageSystemMessage: ChatMessage = {
          role: 'system',
          content: `You are a helpful AI assistant. ${languageInstruction}`
        };

        if (systemMessageIndex >= 0) {
          // Update existing system message
          processedMessages[systemMessageIndex] = {
            ...processedMessages[systemMessageIndex],
            content: `${processedMessages[systemMessageIndex].content}\n\n${languageInstruction}`
          };
        } else {
          // Add system message at the beginning
          processedMessages.unshift(languageSystemMessage);
        }

        console.log(`Language detected: ${detectedLanguage}`);
      }
    }

    // Prepare AI service configuration
    const aiConfig: AIServiceConfig = {
      provider: modelConfig.provider,
      model,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? modelConfig.maxTokens,
      stream: false, // We'll implement streaming later
    };

    // Send message to AI service
    const response = await sendChatMessage(processedMessages, aiConfig);

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 