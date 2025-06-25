import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const chatId = params.chatId;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log('🔎 fetching messages for', chatId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chatId)
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