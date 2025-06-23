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
    const { messages, model = 'gpt-4o', chatId, includeWebSearch, think, deepSearch, language = 'en' } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('📨 Chat API Request:', {
      model,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100),
      webSearch: includeWebSearch || deepSearch,
      think: think,
      language: language
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
    
    // Add language preference to system prompt
    const languageInstructions = language === 'ko' 
      ? '\n\n중요: 사용자가 한국어를 선호하므로 한국어로 응답해 주세요. 단, 코드나 기술적 용어는 영어를 병행 사용할 수 있습니다.\n\n'
      : '\n\nPlease respond in English unless the user specifically requests another language.\n\n';
    
    systemPrompt += languageInstructions;

    // Handle Think mode - add deeper reasoning instructions
    if (think) {
      const thinkInstructions = language === 'ko' 
        ? `\n\n사고 모드(THINK MODE) 활성화됨. 다음을 수행해 주세요:
1. 문제를 단계별로 분석하기
2. 다양한 관점과 접근법 고려하기  
3. 추론 과정을 보여주기
4. 결론에 대한 자세한 설명 제공하기
5. 잠재적 예외 사항이나 복잡성 고려하기\n\n`
        : `\n\nYou are in THINK mode. Please:
1. Break down the problem step by step
2. Consider multiple perspectives and approaches
3. Show your reasoning process
4. Provide detailed explanations for your conclusions
5. Think through potential edge cases or complications\n\n`;
      
      systemPrompt += thinkInstructions;
    }

    // Handle Web Search/Deep Search mode
    const webSearchRequested = includeWebSearch || deepSearch;
    if (webSearchRequested) {
      const webSearchInstructions = language === 'ko'
        ? `\n\n웹 검색 모드(WEB SEARCH MODE) 활성화됨. 응답 시:
1. 현재 정보가 필요한 질문의 경우, 일반적으로 웹 검색을 수행할 것임을 알려주기
2. 어떤 유형의 검색을 수행할지 명시하기
3. 현재 지식으로 최선의 답변 제공하기
4. 정보가 오래되었을 수 있음을 명시하고 현재 출처 확인 권장하기
5. 속보나 최신 이벤트의 경우, 지식 마감일을 명확히 명시하기\n\n`
        : `\n\nYou are in WEB SEARCH mode. When responding:
1. If the question requires current information, acknowledge that you would normally search the web
2. Indicate what type of search you would perform
3. Provide the best answer you can with your current knowledge
4. Note when information might be outdated and suggest the user verify with current sources
5. For breaking news or very recent events, clearly state your knowledge cutoff\n\n`;
      
      systemPrompt += webSearchInstructions;
    }
    
    // Check for any agent mentions in the message
    for (const agent of CONVO_AGENTS) {
      if (userContent.toLowerCase().includes(agent.tag.toLowerCase())) {
        detectedAgent = agent;
        break;
      }
    }

    // If an agent is detected, use its system prompt
    if (detectedAgent) {
      systemPrompt += detectedAgent.systemPrompt;
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
      const baseSystemPrompt = `You are Convocore AI, a helpful and knowledgeable assistant. You provide accurate, helpful responses while being conversational and engaging. You can help with a wide range of topics including coding, writing, analysis, and general questions.

Available specialized agents that users can invoke with @ mentions:
${CONVO_AGENTS.map(agent => `- ${agent.tag}: ${agent.description}`).join('\n')}

If a user wants to use a specialized agent, they can mention it with @ in their message (e.g., "@codegen help me build a React component").

When responding:
1. Be helpful and accurate
2. Provide clear explanations
3. Include relevant examples when appropriate
4. Suggest specialized agents if the user's request would benefit from their expertise`;
      
      systemPrompt = baseSystemPrompt + systemPrompt;
    }

    // Prepare messages for AI with context
    const processedMessages = messages.map((msg: { role: string; content: string; timestamp?: string | number }) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now())
    }));

    // Add system context if available and not using specialized agent
    if (!detectedAgent && systemPrompt) {
      const contextMessage = {
        role: 'system' as const,
        content: [systemPrompt, conversationContext].filter(Boolean).join('\n\n'),
        timestamp: new Date()
      };
      processedMessages.unshift(contextMessage);
    }

    console.log('🧠 Calling AI service with', processedMessages.length, 'messages');

    // Convert processed messages to proper ChatMessage format for AI service
    const chatMessages = processedMessages.map(msg => ({
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
      content: aiResponse,
      model: model,
      chatId: chatId || `chat_${Date.now()}`,
      agentUsed: detectedAgent ? {
        name: detectedAgent.name,
        tag: detectedAgent.tag,
        displayName: detectedAgent.displayName,
        capabilities: detectedAgent.capabilities
      } : null,
      apiStatus,
      features: {
        thinkMode: think,
        webSearchMode: webSearchRequested
      }
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