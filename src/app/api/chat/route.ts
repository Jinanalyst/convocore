import { NextRequest, NextResponse } from 'next/server';
import { advancedAIAgent } from '@/lib/advanced-ai-agent';
import { initializeAIAgent, ensureInitialized } from '@/lib/ai-agent-initialization';
import { nanoid } from 'nanoid';
import type { ConversationContext, ChatMessage } from '@/lib/advanced-ai-agent';
import { sendChatMessage, getModelConfig, type AIServiceConfig } from '@/lib/ai-service';
import { detectAgentFromMessage } from '@/lib/model-agents';
import { MemoryService } from '@/lib/memory-service';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { getRateLimit, canMakeRequest, incrementUsage } from '@/lib/auth';

// Ensure AI agent is initialized
ensureInitialized();

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
    const { 
      messages, 
      model = 'gpt-4', 
      max_tokens = 4000, 
      temperature = 0.7,
      agent_id = 'general-assistant',
      session_id,
      user_id = 'anonymous',
      enable_tools = true 
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        error: 'Messages array is required' 
      }, { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ 
        error: 'Last message must be from user' 
      }, { status: 400 });
    }

    // Convert messages to our ChatMessage format
    const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
      id: msg.id || nanoid(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now())
    }));

    // Create conversation context
    const context: ConversationContext = {
      sessionId: session_id || nanoid(),
      userId: user_id,
      messages: chatMessages,
      currentAgent: agent_id,
      activeTools: [],
      userPreferences: {
        preferred_model: model,
        max_tokens,
        temperature,
        enable_tools,
        auto_execute_safe_tools: true,
        privacy_level: 'medium',
        response_style: 'balanced'
      },
      environmentContext: {
        platform: 'web',
        device_type: 'desktop',
        browser: request.headers.get('user-agent') || 'unknown',
        timezone: 'UTC',
        language: 'en',
        capabilities: ['text', 'tools']
      }
    };

    // Process the message with the advanced AI agent
    console.log('Processing message with advanced AI agent:', {
      agent_id,
      message: lastMessage.content.substring(0, 100),
      enable_tools
    });

    const startTime = Date.now();
    const response = await advancedAIAgent.processMessage(
      lastMessage.content,
      context,
      agent_id
    );

    const processingTime = Date.now() - startTime;
    console.log('AI processing completed:', {
      processingTime,
      model: response.model,
      tokensUsed: response.tokensUsed,
      toolsUsed: response.toolsUsed,
      confidence: response.confidence
    });

    // Return the response in the expected format
    return NextResponse.json({
      content: response.content,
      model: response.model,
      tokens: response.tokensUsed,
      processing_time: processingTime,
      tools_used: response.toolsUsed,
      confidence: response.confidence,
      cost: response.cost,
      suggestions: response.suggestions,
      follow_up_questions: response.followUpQuestions,
      metadata: {
        agent_id,
        session_id: context.sessionId,
        timestamp: new Date().toISOString(),
        capabilities_used: response.toolsUsed.length,
        response_quality: response.confidence > 0.8 ? 'high' : 'medium'
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Return detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint with agent status
    const agents = advancedAIAgent.getAvailableAgents();
    const { toolRegistry } = initializeAIAgent();
    
    return NextResponse.json({
      status: 'healthy',
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        capabilities: agent.capabilities.length,
        tools: agent.tools.length
      })),
      total_agents: agents.length,
      available_tools: toolRegistry.getAvailableTools().length,
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