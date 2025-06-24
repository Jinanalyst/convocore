import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

function getWalletAddress(req: NextRequest): string | null {
  const walletConnected = req.cookies.get('wallet_connected')?.value === 'true';
  if (!walletConnected) return null;
  return req.cookies.get('wallet_address')?.value || null;
}

export async function POST(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, role, content } = body;
    if (!conversationId || !content || !role) {
      return NextResponse.json({ error: 'conversationId, role, and content are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from('wallet_messages').insert({
      wallet_conversation_id: conversationId,
      role,
      content,
    });

    if (error) throw error;

    // update updated_at of conversation
    await supabase
      .from('wallet_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Wallet messages POST error:', err);
    return NextResponse.json({ error: 'Failed to save wallet message' }, { status: 500 });
  }
} 