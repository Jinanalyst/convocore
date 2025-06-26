import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const rawId = params.chatId;
  const supabase = createRouteHandlerClient({ cookies });

  // Utility to quickly check if a string is a valid UUID v4
  const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  // Resolve the actual conversation_id (UUID)
  let conversationId = rawId;

  if (!isUuid(rawId)) {
    // Treat the param as a thread_id and look up the conversation
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('thread_id', rawId)
      .single();

    if (error) {
      console.error('❌ Failed to lookup conversation by thread_id:', error.message);
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    conversationId = conv.id;
  }

  try {
    console.log('🔎 fetching messages for', conversationId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabase query failed:', error.message);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ GET /api/chat/[chatId] failed:', err.message);
    return NextResponse.json(
      { message: 'Failed to fetch messages', detail: err.message },
      { status: 500 }
    );
  }
} 