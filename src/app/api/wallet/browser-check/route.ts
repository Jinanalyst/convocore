import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // Check if user is in a wallet browser
    let isWallet = false;
    let walletType = '';
    
    // Check for common wallet browser indicators
    if (userAgent.includes('Phantom')) {
      isWallet = true;
      walletType = 'Phantom';
    } else if (userAgent.includes('Solflare')) {
      isWallet = true;
      walletType = 'Solflare';
    } else if (userAgent.includes('Backpack')) {
      isWallet = true;
      walletType = 'Backpack';
    } else if (userAgent.includes('Slope')) {
      isWallet = true;
      walletType = 'Slope';
    } else if (userAgent.includes('Glow')) {
      isWallet = true;
      walletType = 'Glow';
    } else if (userAgent.includes('CoinbaseWallet')) {
      isWallet = true;
      walletType = 'Coinbase Wallet';
    } else if (userAgent.includes('MetaMask')) {
      isWallet = true;
      walletType = 'MetaMask';
    }
    
    // Check for wallet-specific referer patterns
    if (!isWallet) {
      if (referer.includes('phantom.app') || referer.includes('phantom')) {
        isWallet = true;
        walletType = 'Phantom';
      } else if (referer.includes('solflare.com') || referer.includes('solflare')) {
        isWallet = true;
        walletType = 'Solflare';
      } else if (referer.includes('backpack.app') || referer.includes('backpack')) {
        isWallet = true;
        walletType = 'Backpack';
      } else if (referer.includes('slope.finance') || referer.includes('slope')) {
        isWallet = true;
        walletType = 'Slope';
      } else if (referer.includes('glow.app') || referer.includes('glow')) {
        isWallet = true;
        walletType = 'Glow';
      } else if (referer.includes('coinbase.com/wallet') || referer.includes('coinbase')) {
        isWallet = true;
        walletType = 'Coinbase Wallet';
      }
    }
    
    return NextResponse.json({
      success: true,
      isWallet,
      walletType,
      userAgent: userAgent.substring(0, 100), // Truncate for privacy
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking wallet browser:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check wallet browser',
        isWallet: false,
        walletType: ''
      },
      { status: 500 }
    );
  }
} 