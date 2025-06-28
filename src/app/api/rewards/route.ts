import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSolanaRewardService, RewardRequest } from '@/lib/solana-reward-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userWalletAddress, 
      rewardAmount, 
      conversationId, 
      conversationLength,
      timestamp 
    } = body;

    // Validate required fields
    if (!userWalletAddress || !rewardAmount || !conversationId || !conversationLength) {
      return NextResponse.json(
        { error: 'Missing required fields: userWalletAddress, rewardAmount, conversationId, conversationLength' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    try {
      new PublicKey(userWalletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate reward amount
    if (typeof rewardAmount !== 'number' || rewardAmount <= 0) {
      return NextResponse.json(
        { error: 'Reward amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate conversation length
    if (typeof conversationLength !== 'number' || conversationLength < 0) {
      return NextResponse.json(
        { error: 'Conversation length must be a non-negative number' },
        { status: 400 }
      );
    }

    // Create reward request
    const rewardRequest: RewardRequest = {
      userWalletAddress: new PublicKey(userWalletAddress),
      rewardAmount,
      conversationId,
      conversationLength,
      timestamp: timestamp || Date.now(),
    };

    // Process the reward
    const rewardService = getSolanaRewardService();
    const result = await rewardService.processReward(rewardRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Reward processed successfully',
        data: {
          userRewardAmount: result.userRewardAmount,
          burnAmount: result.burnAmount,
          userRewardTx: result.userRewardTx,
          burnTx: result.burnTx,
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Reward API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWalletAddress = searchParams.get('userWalletAddress');
    const action = searchParams.get('action');

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'userWalletAddress parameter is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(userWalletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const rewardService = getSolanaRewardService();

    switch (action) {
      case 'balance':
        const balance = await rewardService.getUserTokenBalance(publicKey);
        return NextResponse.json({
          success: true,
          data: { balance }
        });

      case 'daily-limit':
        const dailyInfo = rewardService.getDailyRewardInfo(userWalletAddress);
        return NextResponse.json({
          success: true,
          data: dailyInfo
        });

      case 'treasury-balance':
        const treasuryBalance = await rewardService.getTreasuryBalance();
        return NextResponse.json({
          success: true,
          data: treasuryBalance
        });

      case 'transaction-history':
        const limit = parseInt(searchParams.get('limit') || '10');
        const history = await rewardService.getTransactionHistory(publicKey, limit);
        return NextResponse.json({
          success: true,
          data: history
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: balance, daily-limit, treasury-balance, transaction-history' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Reward API GET error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 