import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, getModelConfig, type ChatMessage, type AIServiceConfig } from '@/lib/ai-service';

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

    // Prepare AI service configuration
    const aiConfig: AIServiceConfig = {
      provider: modelConfig.provider,
      model,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? modelConfig.maxTokens,
      stream: false, // We'll implement streaming later
    };

    // Send message to AI service
    const response = await sendChatMessage(messages, aiConfig);

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