import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/lib/memory-service';
import { createServerComponentClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (action) {
      case 'history':
        const history = await memoryService.getRecentHistory(user.id, limit);
        return NextResponse.json({ history });

      case 'summary':
        const summary = await memoryService.getConversationSummary(user.id);
        return NextResponse.json({ summary });

      case 'recognition':
        const recognition = await memoryService.getUserRecognition(user.id);
        return NextResponse.json({ recognition });

      case 'context':
        const context = await memoryService.getConversationContext(user.id, limit);
        return NextResponse.json({ context });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: history, summary, recognition, or context' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process memory request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, role, content } = body;

    switch (action) {
      case 'save':
        if (!role || !content) {
          return NextResponse.json(
            { error: 'Role and content are required for saving' },
            { status: 400 }
          );
        }
        
        if (!['user', 'assistant'].includes(role)) {
          return NextResponse.json(
            { error: 'Role must be either "user" or "assistant"' },
            { status: 400 }
          );
        }

        await memoryService.saveMessage(user.id, role, content);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: save' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process memory request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Clear all conversation history for the user
    await memoryService.clearHistory(user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation history cleared' 
    });
  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversation history' },
      { status: 500 }
    );
  }
} 