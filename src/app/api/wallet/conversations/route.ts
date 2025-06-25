import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Util to get wallet address from cookies
function getWalletAddress(req: NextRequest): string | null {
  const walletConnected = req.cookies.get('wallet_connected')?.value === 'true';
  if (!walletConnected) return null;
  const addr = req.cookies.get('wallet_address')?.value;
  return addr || null;
}

export async function GET(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('wallet_conversations')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ conversations: data });
  } catch (err: any) {
    console.error('Wallet conversations GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch wallet conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('wallet_conversations')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data });
  } catch (err: any) {
    console.error('Wallet conversations POST error:', err);
    return NextResponse.json({ error: 'Failed to create wallet conversation' }, { status: 500 });
  }
} 