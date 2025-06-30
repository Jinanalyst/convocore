import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check for common wallet providers
    const installedWallets: string[] = [];
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Check for Phantom wallet
      if (typeof (window as any).phantom?.solana !== 'undefined') {
        installedWallets.push('Phantom');
      }
      
      // Check for Solflare wallet
      if (typeof (window as any).solflare !== 'undefined') {
        installedWallets.push('Solflare');
      }
      
      // Check for Backpack wallet
      if (typeof (window as any).backpack !== 'undefined') {
        installedWallets.push('Backpack');
      }
      
      // Check for Slope wallet
      if (typeof (window as any).slope !== 'undefined') {
        installedWallets.push('Slope');
      }
      
      // Check for Glow wallet
      if (typeof (window as any).glow !== 'undefined') {
        installedWallets.push('Glow');
      }
      
      // Check for Coinbase Wallet
      if (typeof (window as any).coinbaseWalletExtension !== 'undefined') {
        installedWallets.push('Coinbase Wallet');
      }
      
      // Check for MetaMask
      if (typeof (window as any).ethereum !== 'undefined') {
        installedWallets.push('MetaMask');
      }
    }
    
    return NextResponse.json({
      success: true,
      installedWallets,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error detecting wallets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to detect wallets',
        installedWallets: []
      },
      { status: 500 }
    );
  }
} 