import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, getModelConfig, type ChatMessage, type AIServiceConfig } from '@/lib/ai-service';
import { detectAgentFromMessage } from '@/lib/model-agents';
import { MemoryService } from '@/lib/memory-service';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { getRateLimit, canMakeRequest, incrementUsage } from '@/lib/auth';

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
    const { messages, model, temperature, maxTokens }: {
      messages: ChatMessage[];
      model: string;
      temperature?: number;
      maxTokens?: number;
    } = body;

    // Get user ID and check rate limits
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('x-user-id') || extractUserIdFromRequest(request);
    let userPlan: 'free' | 'pro' | 'premium' = 'free';
    let dailyUsage = 0;

    try {
      // Check if user is wallet authenticated
      const userAgent = request.headers.get('user-agent') || '';
      const cookies = request.headers.get('cookie') || '';
      const isWalletUser = cookies.includes('wallet_connected=true');
      const isMagicLinkUser = cookies.includes('auth_method=magic_link');

      // Check rate limiting for free plan users
      if (isWalletUser || isMagicLinkUser) {
        // For wallet/magic link users, get usage from headers or assume free plan
        userPlan = 'free'; // Wallet users start with free plan
        const rateLimit = getRateLimit(userPlan);
        
        if (rateLimit > 0) {
          // Get today's date for daily usage reset
          const today = new Date().toDateString();
          const usageKey = isWalletUser ? 'wallet_daily_usage' : 'magic_daily_usage';
          const dateKey = isWalletUser ? 'wallet_usage_date' : 'magic_usage_date';
          
          // Try to get usage from request headers (set by middleware)
          const usageHeader = request.headers.get('x-daily-usage');
          const usageDateHeader = request.headers.get('x-usage-date');
          
          // Reset usage if it's a new day
          if (usageDateHeader !== today) {
            dailyUsage = 0;
          } else {
            dailyUsage = parseInt(usageHeader || '0');
          }

          if (dailyUsage >= rateLimit) {
            return NextResponse.json(
              { 
                error: `Daily chat limit exceeded. Free plan allows ${rateLimit} chats per day. Please upgrade to Pro (20 USDT/month) or Premium (40 USDT/month) for unlimited chats.`,
                type: 'RATE_LIMIT_EXCEEDED',
                limit: rateLimit,
                usage: dailyUsage,
                resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
              },
              { status: 429 }
            );
          }
        }
      } else {
        // For Supabase authenticated users, check database
        try {
          const { createClientComponentClient } = await import('@/lib/supabase');
          const supabase = createClientComponentClient();
          
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            // Get user from session or token
            const authHeader = request.headers.get('authorization');
            if (authHeader) {
              const token = authHeader.replace('Bearer ', '');
              const { data: { user }, error } = await supabase.auth.getUser(token);
              
              if (user && !error) {
                // Get user's subscription plan and usage
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('subscription_tier, daily_usage, usage_date')
                  .eq('id', user.id)
                  .single();

                if (!userError && userData) {
                  userPlan = userData.subscription_tier || 'free';
                  
                  // Check if usage needs to be reset (new day)
                  const today = new Date().toDateString();
                  const usageDate = userData.usage_date ? new Date(userData.usage_date).toDateString() : '';
                  
                  if (usageDate !== today) {
                    // Reset daily usage for new day
                    dailyUsage = 0;
                    await supabase
                      .from('users')
                      .update({ 
                        daily_usage: 0, 
                        usage_date: new Date().toISOString() 
                      })
                      .eq('id', user.id);
                  } else {
                    dailyUsage = userData.daily_usage || 0;
                  }

                  const rateLimit = getRateLimit(userPlan);
                  if (rateLimit > 0 && dailyUsage >= rateLimit) {
                    return NextResponse.json(
                      { 
                        error: `Daily chat limit exceeded. ${userPlan} plan allows ${rateLimit} chats per day. Please upgrade for unlimited chats.`,
                        type: 'RATE_LIMIT_EXCEEDED',
                        limit: rateLimit,
                        usage: dailyUsage,
                        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
                      },
                      { status: 429 }
                    );
                  }
                }
              }
            }
          }
        } catch (supabaseError) {
          console.warn('Could not check Supabase rate limits:', supabaseError);
          // Default to free plan with local storage check
          userPlan = 'free';
        }
      }
    } catch (error) {
      console.warn('Could not check rate limits:', error);
      // Continue without rate limiting for anonymous users
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

    // Add conversation memory for authenticated users (using existing userId)
    let memoryContext = '';
    let userRecognition = null;
    if (userId && latestUserMessage) {
      try {
        // Create memory service instance
        const memoryService = new MemoryService();
        
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
        // Create memory service instance
        const memoryService = new MemoryService();
        
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

    // Increment usage for rate limiting (after successful response)
    if (userId) {
      try {
        await incrementUsage(userId);
        console.log(`Rate limiting: Incremented usage for user ${userId}`);
      } catch (error) {
        console.warn('Failed to increment usage for rate limiting:', error);
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