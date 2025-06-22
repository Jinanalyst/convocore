"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Copy, Check } from "lucide-react";
import { tronPaymentService, formatTronAddress, CONVO_AI_RECIPIENT_ADDRESS } from "@/lib/blockchain";

interface WalletConnectorProps {
  onWalletConnected?: (address: string) => void;
  onPaymentComplete?: (txHash: string) => void;
  plan?: 'pro' | 'premium';
  userId?: string;
}

export function WalletConnector({ 
  onWalletConnected, 
  onPaymentComplete, 
  plan, 
  userId 
}: WalletConnectorProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ TRX: number; USDT: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadBalance();
    }
  }, [walletAddress]);

  const checkWalletConnection = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).tronLink?.ready) {
        const tronLink = (window as any).tronLink;
        if (tronLink.tronWeb?.defaultAddress?.base58) {
          const address = tronLink.tronWeb.defaultAddress.base58;
          setWalletAddress(address);
          onWalletConnected?.(address);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (typeof window === 'undefined' || !(window as any).tronLink) {
        setError('TronLink wallet not found. Please install TronLink extension.');
        return;
      }

      const address = await tronPaymentService.connectWallet();
      if (address) {
        setWalletAddress(address);
        onWalletConnected?.(address);
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadBalance = async () => {
    if (!walletAddress) return;
    
    try {
      const walletBalance = await tronPaymentService.getWalletBalance(walletAddress);
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const processPayment = async () => {
    if (!walletAddress || !plan || !userId) return;
    
    setIsProcessingPayment(true);
    setError(null);

    try {
      // Create payment record
      await tronPaymentService.createPayment(userId, plan);
      
      const amount = plan === 'pro' ? 20 : 40;
      const recipientAddress = process.env.NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS || CONVO_AI_RECIPIENT_ADDRESS;
      
      // Check if user has sufficient USDT balance
      if (balance && balance.USDT < amount) {
        setError(`Insufficient USDT balance. You need ${amount} USDT but only have ${balance.USDT.toFixed(2)} USDT.`);
        return;
      }

      // Process the payment
      const txHash = await tronPaymentService.processPayment(
        walletAddress,
        recipientAddress,
        amount,
        userId
      );

      if (txHash) {
        onPaymentComplete?.(txHash);
        // Refresh balance after payment
        await loadBalance();
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      setError('Payment failed. Please check your wallet and try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openTronScan = () => {
    if (walletAddress) {
      window.open(`https://tronscan.org/#/address/${walletAddress}`, '_blank');
    }
  };

  const installTronLink = () => {
    window.open('https://www.tronlink.org/', '_blank');
  };

  if (typeof window !== 'undefined' && !(window as any).tronLink) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-6 h-6 text-red-600" />
          <h3 className="font-semibold text-red-900 dark:text-red-100">TronLink Required</h3>
        </div>
        <p className="text-red-700 dark:text-red-200 mb-4">
          To make USDT payments, you need to install the TronLink wallet extension.
        </p>
        <Button onClick={installTronLink} className="bg-red-600 hover:bg-red-700">
          Install TronLink
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!walletAddress ? (
        <div className="p-6 border border-gray-200 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Connect Wallet</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your TronLink wallet to make USDT payments for your subscription.
          </p>
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Connect TronLink Wallet'}
          </Button>
        </div>
      ) : (
        <div className="p-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">Wallet Connected</h3>
          </div>
          
          {/* Wallet Address */}
          <div className="mb-4">
            <label className="text-sm font-medium text-green-800 dark:text-green-200">
              Wallet Address
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded text-sm">
                {formatTronAddress(walletAddress)}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="border-green-300 dark:border-green-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openTronScan}
                className="border-green-300 dark:border-green-700"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Balance */}
          {balance && (
            <div className="mb-4">
              <label className="text-sm font-medium text-green-800 dark:text-green-200">
                Wallet Balance
              </label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div className="px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">TRX</div>
                  <div className="font-semibold">{balance.TRX.toFixed(2)}</div>
                </div>
                <div className="px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">USDT</div>
                  <div className="font-semibold">{balance.USDT.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          {plan && userId && (
            <div>
              <Button 
                onClick={processPayment}
                disabled={isProcessingPayment || (balance ? balance.USDT < (plan === 'pro' ? 20 : 40) : false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessingPayment 
                  ? 'Processing Payment...' 
                  : `Pay ${plan === 'pro' ? '20' : '40'} USDT`
                }
              </Button>
              {balance && balance.USDT < (plan === 'pro' ? 20 : 40) && (
                <p className="text-sm text-red-600 mt-2">
                  Insufficient USDT balance. Please add funds to your wallet.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
} 