import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers or session
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const walletAddress = request.headers.get('x-wallet-address');
    
    // In a real app, this would fetch from TRON blockchain API
    // For now, return demo blockchain payment data
    const payments = [
      {
        id: '1',
        date: '2024-12-15T10:30:00Z',
        amount: 50,
        currency: 'USDT',
        plan: 'Pro Plan',
        status: 'completed' as const,
        txHash: '0x742d35cc6cd3e9c4e7c1c8e8e5f9a2b1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
        blockNumber: 45123456,
        fromAddress: walletAddress || 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
        toAddress: 'TRX9a5u6FQvkLvdB2cNm8Hp3kJ4sT7eW9x'
      },
      {
        id: '2',
        date: '2024-11-15T14:22:00Z',
        amount: 50,
        currency: 'USDT',
        plan: 'Pro Plan',
        status: 'completed' as const,
        txHash: '0x8f3e2d1c9b8a7f6e5d4c3b2a1f9e8d7c6b5a4f3e2d1c9b8a7f6e5d4c3b2a1f',
        blockNumber: 44987321,
        fromAddress: walletAddress || 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
        toAddress: 'TRX9a5u6FQvkLvdB2cNm8Hp3kJ4sT7eW9x'
      },
      {
        id: '3',
        date: '2024-10-15T09:15:00Z',
        amount: 20,
        currency: 'USDT',
        plan: 'Basic Plan',
        status: 'completed' as const,
        txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
        blockNumber: 44756789,
        fromAddress: walletAddress || 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
        toAddress: 'TRX9a5u6FQvkLvdB2cNm8Hp3kJ4sT7eW9x'
      }
    ];

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { txHash, amount, currency, plan } = await request.json();
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const walletAddress = request.headers.get('x-wallet-address');
    
    // Validate required fields
    if (!txHash || !amount || !currency || !plan) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      );
    }

    // In a real app, this would:
    // 1. Verify the transaction on TRON blockchain
    // 2. Update user subscription
    // 3. Store payment record in database
    
    console.log(`New payment recorded: ${amount} ${currency} for ${plan} - TX: ${txHash}`);

    const newPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount,
      currency,
      plan,
      status: 'pending' as const,
      txHash,
      blockNumber: undefined,
      fromAddress: walletAddress || 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
      toAddress: 'TRX9a5u6FQvkLvdB2cNm8Hp3kJ4sT7eW9x'
    };

    return NextResponse.json({ payment: newPayment });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
} 