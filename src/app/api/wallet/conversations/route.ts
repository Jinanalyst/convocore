import { NextRequest, NextResponse } from 'next/server';
import { SolanaChatStorage } from '@/lib/solana-chat-storage';
import { usageService } from '@/lib/usage-service';

// Util to get wallet address from cookies
function getWalletAddress(req: NextRequest): string | null {
  const walletConnected = req.cookies.get('wallet_connected')?.value === 'true';
  if (!walletConnected) return null;
  const addr = req.cookies.get('wallet_address')?.value;
  return addr || null;
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
    // Fetch chats from Solana blockchain
    const solanaChats = await solanaChatStorage.fetchChats(walletAddress);
    // Filter out deleted chats
    const activeChats = solanaChats.filter(chat => {
      return !solanaChats.some(c => 
        c.id === `delete_${chat.id}` && c.timestamp > chat.timestamp
      );
    });
    return NextResponse.json({ 
      conversations: activeChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        lastMessage: chat.lastMessage,
        updated_at: chat.timestamp.toISOString(),
        thread_id: chat.threadId,
        signature: chat.signature,
      }))
    });
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
    const plan = usageService.getUserSubscription(walletAddress).tier;
    const solanaChatStorage = getSolanaChatStorageForPlan(plan);
    const body = await req.json();
    const { title, lastMessage, threadId } = body;
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create chat data
    const chatData = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      lastMessage: lastMessage || 'Start a new conversation...',
      timestamp: new Date(),
      threadId,
    };

    // Store chat on Solana (with session key if available)
    const result = await solanaChatStorage.storeChat(walletAddress, chatData);
    
    // Check if result is a signature (session key used) or transaction (manual signing required)
    if (result.length < 100) {
      // This is a transaction signature (session key was used)
      return NextResponse.json({ 
        conversation: {
          ...chatData,
          updated_at: chatData.timestamp.toISOString(),
          thread_id: chatData.threadId,
        },
        signature: result,
        message: 'Chat stored on Solana successfully'
      });
    } else {
      // This is a serialized transaction (manual signing required)
      return NextResponse.json({ 
        conversation: {
          ...chatData,
          updated_at: chatData.timestamp.toISOString(),
          thread_id: chatData.threadId,
        },
        transaction: result,
        message: 'Please sign the transaction to store your chat on Solana'
      });
    }
  } catch (err: any) {
    console.error('Wallet conversations POST error:', err);
    return NextResponse.json({ error: 'Failed to create wallet conversation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const walletAddress = getWalletAddress(req);
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }
    const plan = usageService.getUserSubscription(walletAddress).tier;
    const solanaChatStorage = getSolanaChatStorageForPlan(plan);
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Delete chat on Solana (with session key if available)
    const result = await solanaChatStorage.deleteChat(walletAddress, chatId);
    
    // Check if result is a signature (session key used) or transaction (manual signing required)
    if (result.length < 100) {
      // This is a transaction signature (session key was used)
      return NextResponse.json({ 
        success: true,
        signature: result,
        message: 'Chat deleted from Solana successfully'
      });
    } else {
      // This is a serialized transaction (manual signing required)
      return NextResponse.json({ 
        success: true,
        transaction: result,
        message: 'Please sign the transaction to delete your chat from Solana'
      });
    }
  } catch (err: any) {
    console.error('Wallet conversations DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete wallet conversation' }, { status: 500 });
  }
} 