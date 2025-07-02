import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { verifyTonPayment } from '@/lib/multi-network-payment';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: async () => await cookies() 
    });
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Get user's current subscription status
    const { data: subscription, error: subError } = await supabase
      .rpc('get_user_subscription', { p_user_id: session.user.id });

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    return NextResponse.json({ 
      payments: payments || [],
      subscription: subscription?.[0] || null
    });
  } catch (error) {
    console.error('Error in payments GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: async () => await cookies() 
    });
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { txHash, plan, amount, network } = await request.json();
    
    // Validate required fields
    if (!txHash || !plan || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      );
    }

    // Validate plan and amount
    const validPlans = { pro: 20, premium: 40 };
    if (!validPlans[plan as keyof typeof validPlans] || validPlans[plan as keyof typeof validPlans] !== amount) {
      return NextResponse.json(
        { error: 'Invalid plan or amount' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_hash', txHash)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already processed' },
        { status: 409 }
      );
    }

    // For demo purposes, we'll simulate payment verification
    // In production, you would verify the transaction on the blockchain
    let verified = false;
    if (network === 'ton') {
      // TON: verify with address, memo, and amount
      verified = await verifyTonPayment(
        txHash,
        'EQD5mxRgCuRNLxKxeOjG6r14iSroLF5FtomPnet-sgP5xNJb',
        '165407698',
        10 // 10 TON
      );
    } else {
      verified = await simulatePaymentVerification(txHash, amount, network);
    }
    if (!verified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Process the subscription upgrade
    const { error: upgradeError } = await supabase
      .rpc('upgrade_subscription', {
        p_user_id: session.user.id,
        p_new_tier: plan,
        p_transaction_hash: txHash
      });

    if (upgradeError) {
      console.error('Error upgrading subscription:', upgradeError);
      return NextResponse.json(
        { error: 'Failed to process subscription upgrade' },
        { status: 500 }
      );
    }

    // Get updated subscription info
    const { data: updatedSubscription } = await supabase
      .rpc('get_user_subscription', { p_user_id: session.user.id });

    return NextResponse.json({ 
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
      subscription: updatedSubscription?.[0] || null,
      payment: {
        id: txHash,
        plan,
        amount,
        status: 'confirmed',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// Simulate payment verification - replace with real blockchain verification
async function simulatePaymentVerification(
  txHash: string, 
  amount: number, 
  network: string
): Promise<boolean> {
  // For demo purposes, we'll just check if the transaction hash looks valid
  if (!txHash || txHash.length < 10) {
    return false;
  }

  // Simulate network verification delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In production, implement real verification:
  // - For TRON: Check transaction on TronGrid API
  // - For Ethereum: Check transaction on Etherscan/Infura
  // - For other networks: Use appropriate blockchain APIs
  
  console.log(`Simulating verification for ${network} transaction: ${txHash} (${amount} USDT)`);
  
  // For demo, we'll accept transactions that don't start with "invalid"
  return !txHash.toLowerCase().startsWith('invalid');
}

// New endpoint to check subscription status and expire if needed
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: async () => await cookies() 
    });
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check and expire subscriptions
    const { error: expireError } = await supabase.rpc('check_expired_subscriptions');
    
    if (expireError) {
      console.error('Error checking expired subscriptions:', expireError);
    }

    // Reset API usage if needed
    const { error: resetError } = await supabase.rpc('reset_api_usage');
    
    if (resetError) {
      console.error('Error resetting API usage:', resetError);
    }

    // Get updated subscription info
    const { data: subscription } = await supabase
      .rpc('get_user_subscription', { p_user_id: session.user.id });

    return NextResponse.json({ 
      success: true,
      subscription: subscription?.[0] || null
    });

  } catch (error) {
    console.error('Error in payments PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription status' },
      { status: 500 }
    );
  }
}

// Ensure this route is treated as dynamic so that accessing cookies is always allowed
export const dynamic = 'force-dynamic'; 