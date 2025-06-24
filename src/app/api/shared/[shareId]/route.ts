import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient();
    
    // Get the shared chat record
    const { data: sharedChat, error: shareError } = await supabase
      .from('shared_chats')
      .select(`
        id,
        chat_id,
        is_public,
        allow_comments,
        expires_at,
        password_hash,
        created_at
      `)
      .eq('id', shareId)
      .single();

    if (shareError || !sharedChat) {
      console.error('Share not found:', shareError);
      return NextResponse.json(
        { error: 'This shared chat was not found or may have expired' },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (sharedChat.expires_at && new Date(sharedChat.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This shared chat has expired' },
        { status: 410 }
      );
    }

    // Check if chat is public
    if (!sharedChat.is_public) {
      return NextResponse.json(
        { error: 'This shared chat is private' },
        { status: 403 }
      );
    }

    // Get the actual conversation and messages
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        model,
        created_at,
        messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq('id', sharedChat.chat_id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Sort messages by creation time
    const sortedMessages = conversation.messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const chatData = {
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      created_at: conversation.created_at,
      messages: sortedMessages,
      isPublic: sharedChat.is_public,
      allowComments: sharedChat.allow_comments
    };

    return NextResponse.json({ 
      success: true, 
      chat: chatData 
    });

  } catch (error) {
    console.error('Shared chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to load shared chat. Please check if the chat exists and is properly shared.' },
      { status: 500 }
    );
  }
} 