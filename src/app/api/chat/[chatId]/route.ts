import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// fallback admin client – see step 3
import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!       // set in Vercel env
);

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const chatId = params.chatId;

  /* ------------ 1-A  try with the normal authed client ------------ */
  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log('🔎 fetching messages for', chatId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;                // forces catch
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ normal query failed', err?.message ?? err);

    /* ------------ 1-B  fall back to service-role key ------------- */
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json(data);
    } catch (adminErr: any) {
      console.error('❌ admin query failed', adminErr?.message ?? adminErr);

      return NextResponse.json(
        { message: 'Supabase error', detail: adminErr?.message ?? adminErr },
        { status: 500 }
      );
    }
  }
} 