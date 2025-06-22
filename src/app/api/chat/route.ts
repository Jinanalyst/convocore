import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, getModelConfig, type ChatMessage, type AIServiceConfig } from '@/lib/ai-service';
import { detectAgentFromMessage } from '@/lib/model-agents';
import { memoryService } from '@/lib/memory-service';
import { createServerComponentClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

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

    // Get user ID for memory-aware conversations
    let userId: string | null = null;
    try {
      const supabase = await createServerComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (error) {
      console.warn('Could not get user for memory:', error);
      // Continue without memory for anonymous users
    }

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

    // Add conversation memory for authenticated users
    let memoryContext = '';
    let userRecognition = null;
    if (userId && latestUserMessage) {
      try {
        // Get user recognition info
        userRecognition = await memoryService.getUserRecognition(userId);
        
        // Get conversation context
        memoryContext = await memoryService.getConversationContext(userId, 6);
        
        console.log(`Memory: User ${userId} - Returning: ${userRecognition.isReturningUser}, Messages: ${userRecognition.messageCount}`);
      } catch (error) {
        console.warn('Memory service error:', error);
      }
    }

    if (latestUserMessage) {
      // Detect language from user's message
      const detectedLanguage = detectLanguage(latestUserMessage.content);
      
      // Create language instruction
      const languageInstruction = detectedLanguage === 'ko' 
        ? 'Please respond in Korean (한국어). Use natural Korean expressions and grammar.'
        : 'Please respond in English. Use clear and natural English expressions.';

      const detectedAgent = detectAgentFromMessage(latestUserMessage.content);
      
      if (detectedAgent) {
        // Add or update system message with agent's system prompt + language instruction + memory
        const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
        
        // Build system message with memory context
        let systemContent = detectedAgent.systemPrompt;
        
        // Add user recognition if available
        if (userRecognition?.isReturningUser) {
          systemContent += `\n\nUser Recognition: This is a returning user with ${userRecognition.messageCount} previous messages. Last seen: ${userRecognition.lastSeen ? new Date(userRecognition.lastSeen).toLocaleDateString() : 'recently'}. Topics discussed: ${userRecognition.preferredTopics.join(', ')}.`;
        }
        
        // Add conversation memory
        if (memoryContext) {
          systemContent += `\n\n${memoryContext}`;
        }
        
        systemContent += `\n\n${languageInstruction}`;
        
        const agentSystemMessage: ChatMessage = {
          role: 'system',
          content: systemContent
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
        // Add language instruction and memory even without agent
        const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
        
        // Build system message with memory context
        let systemContent = 'You are Convocore, a helpful AI assistant.';
        
        // Add user recognition if available
        if (userRecognition?.isReturningUser) {
          systemContent += ` Welcome back! I remember our previous conversations. You've sent ${userRecognition.messageCount} messages, and we've discussed topics like: ${userRecognition.preferredTopics.join(', ')}.`;
        }
        
        // Add conversation memory
        if (memoryContext) {
          systemContent += `\n\n${memoryContext}`;
        }
        
        systemContent += ` ${languageInstruction}`;
        
        const languageSystemMessage: ChatMessage = {
          role: 'system',
          content: systemContent
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

    // Track usage before sending to AI service
    const userMessage = latestUserMessage?.content || '';
    const tokenEstimate = userMessage.length; // Rough token estimation
    
    // Track usage (this would be more sophisticated in a real app)
    try {
      await fetch(`${request.nextUrl.origin}/api/user/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': request.headers.get('x-user-id') || 'demo-user',
        },
        body: JSON.stringify({ 
          type: 'aiRequests', 
          increment: 1 
        })
      });
      
      await fetch(`${request.nextUrl.origin}/api/user/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': request.headers.get('x-user-id') || 'demo-user',
        },
        body: JSON.stringify({ 
          type: 'apiCalls', 
          increment: 1 
        })
      });
      
      await fetch(`${request.nextUrl.origin}/api/user/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': request.headers.get('x-user-id') || 'demo-user',
        },
        body: JSON.stringify({ 
          type: 'tokensUsed', 
          increment: tokenEstimate 
        })
      });
    } catch (usageError) {
      console.warn('Failed to track usage:', usageError);
    }

    // Send message to AI service
    const response = await sendChatMessage(processedMessages, aiConfig);

    // Save conversation to memory for authenticated users
    if (userId && latestUserMessage && response) {
      try {
        // Save user message
        await memoryService.saveMessage(userId, 'user', latestUserMessage.content);
        
        // Save assistant response
        const assistantContent = typeof response === 'string' ? response : response.content || 'Response generated';
        await memoryService.saveMessage(userId, 'assistant', assistantContent);
        
        console.log(`Memory: Saved conversation for user ${userId}`);
      } catch (error) {
        console.warn('Failed to save conversation to memory:', error);
        // Continue without memory saving
      }
    }

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