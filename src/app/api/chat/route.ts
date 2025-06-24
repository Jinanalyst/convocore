import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memoryService } from '@/lib/memory-service';
import { aiService } from '@/lib/ai-service';

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

    // Check for agent mentions
    const userContent = userMessage.content.toLowerCase();
    let systemPrompt = '';
    
    if (userContent.includes('@codegen')) {
      systemPrompt = 'You are @codegen, a specialized code generation assistant. Focus on creating clean, efficient code with proper TypeScript types, Next.js best practices, and modern React patterns. Always include necessary imports and follow the existing codebase structure.';
    } else if (userContent.includes('@debugger')) {
      systemPrompt = 'You are @debugger, a debugging specialist. Analyze code issues, identify root causes, and provide step-by-step solutions. Focus on error messages, stack traces, and systematic troubleshooting approaches.';
    } else if (userContent.includes('@uiwizard')) {
      systemPrompt = 'You are @uiwizard, a UI/UX design expert. Create beautiful, responsive interfaces using Tailwind CSS. Focus on modern design principles, accessibility, and user experience best practices.';
    }

    // Prepare messages for AI with context
    const processedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system context if available
    if (systemPrompt || conversationContext) {
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
      chatId: chatId || `chat_${Date.now()}`
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 