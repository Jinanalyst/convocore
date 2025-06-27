import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const rawId = params.chatId;
  const headersList = await headers();
  const walletAddress = headersList.get('x-wallet-address');

  // Handle demo chats - return empty messages
  if (rawId.startsWith('demo_')) {
    console.log('📝 Demo chat detected, returning empty messages');
    return NextResponse.json([]);
  }

  // Handle local chats - return empty messages (they're stored in localStorage)
  if (rawId.startsWith('local_chat_')) {
    console.log('📝 Local chat detected, returning empty messages');
    return NextResponse.json([]);
  }

  // Handle Solana wallet chats
  if (walletAddress) {
    try {
      console.log('🔎 Fetching Solana messages for conversation:', rawId);
      
      // Fetch messages from Solana blockchain
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wallet/messages?conversationId=${rawId}`, {
        headers: {
          'x-wallet-address': walletAddress,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data.messages || []);
      } else {
        console.error('❌ Failed to fetch Solana messages:', response.statusText);
        return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
      }
    } catch (err: any) {
      console.error('❌ GET /api/chat/[chatId] Solana fetch failed:', err.message);
      return NextResponse.json(
        { message: 'Failed to fetch messages', detail: err.message },
        { status: 500 }
      );
    }
  }

  // Fallback for unknown chat types
  console.log('⚠️ Unknown chat type, returning empty messages');
  return NextResponse.json([]);
} 