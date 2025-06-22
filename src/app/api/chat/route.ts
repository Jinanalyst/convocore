import { NextRequest, NextResponse } from 'next/server';
import { advancedAIAgent } from '@/lib/advanced-ai-agent';
import { initializeAIAgent } from '@/lib/ai-agent-initialization';
import { nanoid } from 'nanoid';
import type { ConversationContext, ChatMessage } from '@/lib/advanced-ai-agent';
import { sendChatMessage, getModelConfig, type AIServiceConfig, AI_MODELS } from '@/lib/ai-service';
import { detectAgentFromMessage } from '@/lib/model-agents';
import { MemoryService } from '@/lib/memory-service';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { getRateLimit, canMakeRequest, incrementUsage } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai-service';
import { CONVO_AGENTS, getAgentByTag, formatMessageWithAgent } from '@/lib/model-agents';
import { memoryService } from '@/lib/memory-service';

// Simple language detection function
function detectLanguage(text: string): string {
  // Simple Korean detection - checks for Hangul characters
  const koreanRegex = /[\u3131-\u3163\uac00-\ud7a3]/;
  return koreanRegex.test(text) ? 'ko' : 'en';
}

function extractUserIdFromRequest(request: NextRequest): string | null {
  try {
    // Check for user ID in various places
    const cookies = request.headers.get('cookie') || '';
    
    // Extract from wallet_address cookie if wallet user
    if (cookies.includes('wallet_connected=true')) {
      const walletMatch = cookies.match(/wallet_address=([^;]+)/);
      if (walletMatch) {
        return `wallet_${walletMatch[1]}`;
      }
    }
    
    // Extract from other auth methods
    const userIdMatch = cookies.match(/user_id=([^;]+)/);
    if (userIdMatch) {
      return userIdMatch[1];
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to extract user ID:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'gpt-4o', chatId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('📨 Chat API Request:', {
      model,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
    });

    // Check API configuration status
    const apiStatus = await aiService.validateConfiguration();
    console.log('🔑 API Configuration Status:', apiStatus);

    if (!apiStatus.openai && !apiStatus.anthropic) {
      console.error('❌ No AI API keys configured');
      return NextResponse.json({
        error: 'AI service not configured',
        details: 'Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables',
        configStatus: apiStatus
      }, { status: 503 });
    }

    // Get user ID from session or wallet
    let userId = 'anonymous';
    
    // Try to get user from Supabase auth
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.log('Supabase auth not available:', error);
      }
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    
    // Save user message to memory
    if (userId !== 'anonymous') {
      try {
        await memoryService.saveMessage(userId, 'user', userMessage.content);
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

    // Get conversation context for memory-aware responses
    let conversationContext = '';
    if (userId !== 'anonymous') {
      try {
        conversationContext = await memoryService.getConversationContext(userId);
      } catch (error) {
        console.error('Failed to get conversation context:', error);
      }
    }

    // Enhanced agent detection and handling
    const userContent = userMessage.content;
    let systemPrompt = '';
    let detectedAgent = null;
    
    // Check for any agent mentions in the message
    for (const agent of CONVO_AGENTS) {
      if (userContent.toLowerCase().includes(agent.tag.toLowerCase())) {
        detectedAgent = agent;
        break;
      }
    }

    // If an agent is detected, use its system prompt
    if (detectedAgent) {
      systemPrompt = detectedAgent.systemPrompt;
      console.log(`🤖 Agent detected: ${detectedAgent.name} (${detectedAgent.tag})`);
      
      // Clean the message by removing the agent tag
      const cleanedContent = userContent.replace(new RegExp(detectedAgent.tag, 'gi'), '').trim();
      
      // Create enhanced message with agent context
      const enhancedMessage = `${detectedAgent.systemPrompt}

User Request: ${cleanedContent}

Please respond as ${detectedAgent.name} (${detectedAgent.displayName}) with your specialized expertise in: ${detectedAgent.capabilities.join(', ')}. 

Focus on providing actionable, detailed solutions that match your capabilities. If the request doesn't align with your specialization, acknowledge it and provide general guidance while suggesting a more appropriate agent if available.`;

      // Update the user message content
      userMessage.content = enhancedMessage;
    } else {
      // Default system prompt for general conversations
      systemPrompt = `You are Convocore AI, a helpful and knowledgeable assistant. You provide accurate, helpful responses while being conversational and engaging. You can help with a wide range of topics including coding, writing, analysis, and general questions.

Available specialized agents that users can invoke with @ mentions:
${CONVO_AGENTS.map(agent => `- ${agent.tag}: ${agent.description}`).join('\n')}

If a user wants to use a specialized agent, they can mention it with @ in their message (e.g., "@codegen help me build a React component").

When responding:
1. Be helpful and accurate
2. Provide clear explanations
3. Include relevant examples when appropriate
4. Suggest specialized agents if the user's request would benefit from their expertise`;
    }

    // Prepare messages for AI with context
    const processedMessages = messages.map((msg: { role: string; content: string; timestamp?: string | number }) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now())
    }));

    // Add system context if available and not using specialized agent
    if (!detectedAgent && (systemPrompt || conversationContext)) {
      const contextMessage = {
        role: 'system' as const,
        content: [systemPrompt, conversationContext].filter(Boolean).join('\n\n')
      };
      processedMessages.unshift(contextMessage);
    }

    console.log('🧠 Calling AI service with', processedMessages.length, 'messages');

    // Convert processed messages to proper ChatMessage format
    const chatMessages: ChatMessage[] = processedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    // Get AI response with enhanced error handling
    let aiResponse: string;
    try {
      aiResponse = await aiService.generateResponse(chatMessages, model);
      console.log('✅ AI response generated successfully');
    } catch (aiError) {
      console.error('🚨 AI Service Error:', aiError);
      
      // Provide more specific error messages
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI service error';
      
      if (errorMessage.includes('API key not configured')) {
        return NextResponse.json({
          error: 'AI API key not configured',
          details: 'Please check your environment variables for OPENAI_API_KEY or ANTHROPIC_API_KEY',
          apiStatus
        }, { status: 503 });
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return NextResponse.json({
          error: 'API quota exceeded',
          details: 'The AI service has reached its usage limit. Please try again later or upgrade your plan.',
        }, { status: 429 });
      } else if (errorMessage.includes('Invalid API key')) {
        return NextResponse.json({
          error: 'Invalid API key',
          details: 'The configured API key is invalid. Please check your environment variables.',
        }, { status: 401 });
      } else {
        return NextResponse.json({
          error: 'AI service error',
          details: errorMessage,
          suggestion: 'Please check your API configuration and try again.'
        }, { status: 500 });
      }
    }

    // Save AI response to memory
    if (userId !== 'anonymous') {
      try {
        await memoryService.saveMessage(userId, 'assistant', aiResponse);
      } catch (error) {
        console.error('Failed to save AI response:', error);
      }
    }

    return NextResponse.json({ 
      response: aiResponse,
      model: model,
      chatId: chatId || `chat_${Date.now()}`,
      agentUsed: detectedAgent ? {
        name: detectedAgent.name,
        tag: detectedAgent.tag,
        displayName: detectedAgent.displayName,
        capabilities: detectedAgent.capabilities
      } : null,
      apiStatus
    });

  } catch (error) {
    console.error('💥 Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: 'API request failed',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint with basic status
    const apiStatus = {
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Chat API is running',
      apiStatus,
      availableModels: Object.keys(AI_MODELS),
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });

  } catch (error) {
    console.error('Error in chat API health check:', error);
    
    return NextResponse.json({ 
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 