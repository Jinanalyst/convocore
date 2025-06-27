import { NextRequest, NextResponse } from 'next/server';
import { SolanaChatStorage } from '@/lib/solana-chat-storage';
import { usageService } from '@/lib/usage-service';

function getWalletAddress(req: NextRequest): string | null {
  const walletConnected = req.cookies.get('wallet_connected')?.value === 'true';
  if (!walletConnected) return null;
  return req.cookies.get('wallet_address')?.value || null;
}

function getSolanaChatStorageForPlan(plan: 'free' | 'pro' | 'premium') {
  if (plan === 'free') {
    return new SolanaChatStorage('https://api.devnet.solana.com');
  } else {
    return new SolanaChatStorage('https://api.mainnet-beta.solana.com');
  }
}

export async function GET(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }
    const plan = usageService.getUserSubscription(walletAddress).tier;
    const solanaChatStorage = getSolanaChatStorageForPlan(plan);
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    // Fetch messages from Solana blockchain
    const messages = await solanaChatStorage.fetchMessages(walletAddress, conversationId);
    return NextResponse.json({ 
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.timestamp.toISOString(),
        signature: msg.signature,
      }))
    });
  } catch (err: any) {
    console.error('Wallet messages GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch wallet messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }
    const plan = usageService.getUserSubscription(walletAddress).tier;
    const solanaChatStorage = getSolanaChatStorageForPlan(plan);
    const body = await req.json();
    const { conversationId, role, content } = body;
    if (!conversationId || !content || !role) {
      return NextResponse.json({ error: 'conversationId, role, and content are required' }, { status: 400 });
    }
    
    // Create message data
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
    };

    // Store message on Solana (with session key if available)
    const result = await solanaChatStorage.storeMessage(walletAddress, conversationId, messageData);
    
    // Check if result is a signature (session key used) or transaction (manual signing required)
    if (result.length < 100) {
      // This is a transaction signature (session key was used)
      return NextResponse.json({ 
        success: true,
        messageData: {
          ...messageData,
          created_at: messageData.timestamp.toISOString(),
        },
        signature: result,
        message: 'Message stored on Solana successfully'
      });
    } else {
      // This is a serialized transaction (manual signing required)
      return NextResponse.json({ 
        success: true,
        messageData: {
          ...messageData,
          created_at: messageData.timestamp.toISOString(),
        },
        transaction: result,
        message: 'Please sign the transaction to store your message on Solana'
      });
    }
  } catch (err: any) {
    console.error('Wallet messages POST error:', err);
    return NextResponse.json({ error: 'Failed to save wallet message' }, { status: 500 });
  }
} 