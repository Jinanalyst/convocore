import { NextRequest, NextResponse } from 'next/server';
import { advancedAIAgent } from '@/lib/advanced-ai-agent';
import { initializeAIAgent } from '@/lib/ai-agent-initialization';
import { nanoid } from 'nanoid';
import type { ConversationContext, ChatMessage } from '@/lib/advanced-ai-agent';
import { sendChatMessage, getModelConfig, type AIServiceConfig } from '@/lib/ai-service';
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
      
      // Clean the message by removing the agent tag
      const cleanedContent = userContent.replace(new RegExp(detectedAgent.tag, 'gi'), '').trim();
      
      // Create enhanced message with agent context
      const enhancedMessage = `${detectedAgent.systemPrompt}

User Request: ${cleanedContent}

Please respond as ${detectedAgent.name} (${detectedAgent.displayName}) with your specialized expertise in: ${detectedAgent.capabilities.join(', ')}. 

Focus on providing actionable, detailed solutions that match your capabilities. If the request doesn't align with your specialization, acknowledge it and provide general guidance while suggesting a more appropriate agent if available.`;

      // Update the user message content
      userMessage.content = enhancedMessage;
      
      // Log agent usage for analytics
      console.log(`Agent ${detectedAgent.name} (${detectedAgent.tag}) activated for user request`);
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

    // Get AI response
    const aiResponse = await aiService.generateResponse(processedMessages, model);

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
      } : null
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
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