import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { usageService } from '@/lib/usage-service';
import { chainScopeService } from '@/lib/chainscope-service';
import { CONVO_AGENTS } from '@/lib/model-agents';

// Simple language detection function
function detectLanguage(text: string): string {
  const koreanRegex = /[\u3131-\u3163\uac00-\ud7a3]/;
  return koreanRegex.test(text) ? 'ko' : 'en';
}

const FREE_PLAN_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called');
    const body = await request.json();
    const {
      messages,
      model = 'gpt-4o',
      chatId,
      includeWebSearch = false,
      deepSearch = false,
      think = false,
      language = 'en',
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        error: 'Messages array is required and cannot be empty',
      }, { status: 400 });
    }

    // Extract user ID from wallet cookies
    let userId = 'anonymous';
    const walletConnected = request.cookies.get('wallet_connected')?.value === 'true';
    const walletAddress = request.cookies.get('wallet_address')?.value;
    if (walletConnected && walletAddress) {
      userId = `wallet_${walletAddress.toLowerCase()}`;
      console.log('🔗 Wallet user detected:', userId);
    }

    // Check usage limits for authenticated users
    if (userId !== 'anonymous') {
      const usage = usageService.getUserUsage(userId);
      if (usage.requestsUsed >= FREE_PLAN_LIMIT) {
        return NextResponse.json({
          error: 'Usage limit exceeded',
          details: 'Daily limit of 3 chats reached. Upgrade to Pro for unlimited chats.',
          upgradeUrl: '/pricing',
        }, { status: 429 });
      }
    }

    // Determine user plan
    const subscription = usageService.getUserSubscription(userId);
    const plan = subscription?.tier || 'free';
    let selectedModel = model;
    if (plan === 'free') {
      selectedModel = 'convoq';
    }

    const userMessage = messages[messages.length - 1];
    let conversationContext = '';
    // (Optional) Add memory/context logic here if needed

    // Enhanced agent detection and handling
    const userContent = userMessage.content;
    let systemPrompt = '';
    let detectedAgent = null;
    const languageInstructions = language === 'ko'
      ? '\n\n중요: 사용자가 한국어를 선호하므로 한국어로 응답해 주세요. 단, 코드나 기술적 용어는 영어를 병행 사용할 수 있습니다.\n\n'
      : '\n\nPlease respond in English unless the user specifically requests another language.\n\n';
    systemPrompt += languageInstructions;
    if (think) {
      const thinkInstructions = language === 'ko'
        ? `\n\n사고 모드(THINK MODE) 활성화됨. 다음을 수행해 주세요:\n1. 문제를 단계별로 분석하기\n2. 다양한 관점과 접근법 고려하기  \n3. 추론 과정을 보여주기\n4. 결론에 대한 자세한 설명 제공하기\n5. 잠재적 예외 사항이나 복잡성 고려하기\n\n`
        : `\n\nYou are in THINK mode. Please:\n1. Break down the problem step by step\n2. Consider multiple perspectives and approaches\n3. Show your reasoning process\n4. Provide detailed explanations for your conclusions\n5. Think through potential edge cases or complications\n\n`;
      systemPrompt += thinkInstructions;
    }
    const webSearchRequested = includeWebSearch || deepSearch;
    if (webSearchRequested) {
      const webSearchInstructions = language === 'ko'
        ? `\n\n웹 검색 모드(WEB SEARCH MODE) 활성화됨. 응답 시:\n1. 현재 정보가 필요한 질문의 경우, 일반적으로 웹 검색을 수행할 것임을 알려주기\n2. 어떤 유형의 검색을 수행할지 명시하기`
        : `\n\nWeb search mode enabled. If the question requires up-to-date information, mention that you will perform a web search and specify the type of search.`;
      systemPrompt += webSearchInstructions;
    }
    for (const agent of CONVO_AGENTS) {
      if (userContent.toLowerCase().includes(agent.tag.toLowerCase())) {
        detectedAgent = agent;
        break;
      }
    }
    if (detectedAgent) {
      systemPrompt += detectedAgent.systemPrompt;
      const cleanedContent = userContent.replace(new RegExp(detectedAgent.tag, 'gi'), '').trim();
      const enhancedMessage = `${detectedAgent.systemPrompt}\n\nUser Request: ${cleanedContent}\n\nPlease respond as ${detectedAgent.name} (${detectedAgent.displayName}) with your specialized expertise in: ${detectedAgent.capabilities.join(', ')}. \n\nFocus on providing actionable, detailed solutions that match your capabilities. If the request doesn't align with your specialization, acknowledge it and provide general guidance while suggesting a more appropriate agent if available.`;
      userMessage.content = enhancedMessage;
    } else {
      const baseSystemPrompt = `You are Convocore AI, a helpful and knowledgeable assistant. You provide accurate, helpful responses while being conversational and engaging. You can help with a wide range of topics including coding, writing, analysis, and general questions.\n\nAvailable specialized agents that users can invoke with @ mentions:\n${CONVO_AGENTS.map(agent => `- ${agent.tag}: ${agent.description}`).join('\n')}\n\nIf a user wants to use a specialized agent, they can mention it with @ in their message (e.g., "@codegen help me build a React component", "@chainscope analyze $ETH").\n\nWhen responding:\n1. Be helpful and accurate\n2. Provide clear explanations\n3. Include relevant examples when appropriate\n4. Suggest specialized agents if the user's request would benefit from their expertise\n5. For crypto-related questions, suggest using @chainscope for detailed analysis`;
      systemPrompt = baseSystemPrompt + systemPrompt;
    }
    const processedMessages = messages.map((msg: { role: string; content: string; timestamp?: string | number }) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now()),
    }));
    if (!detectedAgent && systemPrompt) {
      const contextMessage = {
        role: 'system' as const,
        content: [systemPrompt, conversationContext].filter(Boolean).join('\n\n'),
        timestamp: new Date(),
      };
      processedMessages.unshift(contextMessage);
    }
    const chatMessages = processedMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
    let aiResponse: string;
    try {
      aiResponse = await aiService.generateResponse(chatMessages, selectedModel);
      if (userId !== 'anonymous') {
        usageService.incrementUsage(userId);
      }
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI service error';
      if (errorMessage.includes('API key not configured')) {
        return NextResponse.json({
          error: 'AI API key not configured',
          details: 'Please check your environment variables for OPENAI_API_KEY or ANTHROPIC_API_KEY',
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
          suggestion: 'Please check your API configuration and try again.',
        }, { status: 500 });
      }
    }
    return NextResponse.json({
      response: aiResponse,
      content: aiResponse,
      model: selectedModel,
      chatId: chatId || `chat_${Date.now()}`,
      agentUsed: detectedAgent
        ? {
            name: detectedAgent.name,
            tag: detectedAgent.tag,
            displayName: detectedAgent.displayName,
            capabilities: detectedAgent.capabilities,
          }
        : null,
      features: {
        thinkMode: think,
        webSearchMode: webSearchRequested,
      },
    });
  } catch (err: any) {
    console.error('API /chat/route.ts POST error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

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