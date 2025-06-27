import { NextRequest, NextResponse } from 'next/server';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

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
    const { signedTransaction } = body;
    
    if (!signedTransaction) {
      return NextResponse.json({ error: 'Signed transaction is required' }, { status: 400 });
    }

    console.log('📤 Submitting signed Solana transaction for wallet:', walletAddress);

    // Deserialize and submit the signed transaction
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    try {
      const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));
      const signature = await connection.sendRawTransaction(transaction.serialize());
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      console.log('✅ Transaction confirmed:', signature);

      return NextResponse.json({ 
        success: true,
        signature,
        message: 'Transaction successfully submitted to Solana'
      });
    } catch (txError: any) {
      console.error('Transaction submission error:', txError);
      return NextResponse.json({ 
        error: 'Transaction failed to submit',
        details: txError.message 
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Wallet transactions POST error:', err);
    return NextResponse.json({ error: 'Failed to submit transaction' }, { status: 500 });
  }
} 