import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { chatId } = params;

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Could not fetch messages' }, { status: 500 });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 