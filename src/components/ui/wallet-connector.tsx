"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Copy, Check, ChevronDown } from "lucide-react";
import { tronPaymentService, formatTronAddress, CONVO_AI_RECIPIENT_ADDRESS } from "@/lib/blockchain";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'tron' | 'ethereum' | 'solana' | 'bitcoin';
  installUrl: string;
  isInstalled: () => boolean;
  connect: () => Promise<string | null>;
}

interface WalletConnectorProps {
  onWalletConnected?: (address: string, walletType: string) => void;
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
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ TRX: number; USDT: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Define wallet options
  const walletOptions: WalletOption[] = [
    {
      id: 'tronlink',
      name: 'TronLink',
      icon: '🔗',
      description: 'TRON blockchain wallet for USDT payments',
      type: 'tron',
      installUrl: 'https://www.tronlink.org/',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).tronLink,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).tronLink) return null;
        return await tronPaymentService.connectWallet();
      }
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Popular Ethereum wallet',
      type: 'ethereum',
      installUrl: 'https://metamask.io/',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) return null;
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          return accounts[0] || null;
        } catch (error) {
          console.error('MetaMask connection failed:', error);
          return null;
        }
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔄',
      description: 'Connect any mobile wallet',
      type: 'ethereum',
      installUrl: 'https://walletconnect.com/',
      isInstalled: () => true, // WalletConnect is always available
      connect: async () => {
        // This would require WalletConnect SDK integration
        console.log('WalletConnect integration would go here');
        return null;
      }
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Solana blockchain wallet',
      type: 'solana',
      installUrl: 'https://phantom.app/',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).solana?.isPhantom,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).solana?.isPhantom) return null;
        try {
          const response = await (window as any).solana.connect();
          return response.publicKey.toString();
        } catch (error) {
          console.error('Phantom connection failed:', error);
          return null;
        }
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Coinbase\'s self-custody wallet',
      type: 'ethereum',
      installUrl: 'https://wallet.coinbase.com/',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).ethereum?.isCoinbaseWallet) return null;
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          return accounts[0] || null;
        } catch (error) {
          console.error('Coinbase Wallet connection failed:', error);
          return null;
        }
      }
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Multi-chain mobile wallet',
      type: 'ethereum',
      installUrl: 'https://trustwallet.com/',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isTrust,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).ethereum?.isTrust) return null;
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          return accounts[0] || null;
        } catch (error) {
          console.error('Trust Wallet connection failed:', error);
          return null;
        }
      }
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: '⭕',
      description: 'Multi-chain crypto wallet',
      type: 'ethereum',
      installUrl: 'https://www.okx.com/web3',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).okxwallet,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).okxwallet) return null;
        try {
          const accounts = await (window as any).okxwallet.request({ method: 'eth_requestAccounts' });
          return accounts[0] || null;
        } catch (error) {
          console.error('OKX Wallet connection failed:', error);
          return null;
        }
      }
    },
    {
      id: 'binance',
      name: 'Binance Wallet',
      icon: '🟡',
      description: 'Binance Chain wallet',
      type: 'ethereum',
      installUrl: 'https://www.binance.org/en/binance-wallet',
      isInstalled: () => typeof window !== 'undefined' && !!(window as any).BinanceChain,
      connect: async () => {
        if (typeof window === 'undefined' || !(window as any).BinanceChain) return null;
        try {
          const accounts = await (window as any).BinanceChain.request({ method: 'eth_requestAccounts' });
          return accounts[0] || null;
        } catch (error) {
          console.error('Binance Wallet connection failed:', error);
          return null;
        }
      }
    }
  ];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletAddress && walletType === 'tronlink') {
      loadBalance();
    }
  }, [walletAddress, walletType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('wallet-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkWalletConnection = async () => {
    try {
      // Check TronLink first (for backward compatibility)
      if (typeof window !== 'undefined' && (window as any).tronLink?.ready) {
        const tronLink = (window as any).tronLink;
        if (tronLink.tronWeb?.defaultAddress?.base58) {
          const address = tronLink.tronWeb.defaultAddress.base58;
          setWalletAddress(address);
          setWalletType('tronlink');
          setSelectedWallet(walletOptions.find(w => w.id === 'tronlink') || null);
          onWalletConnected?.(address, 'tronlink');
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleWalletSelect = async (wallet: WalletOption) => {
    setIsDropdownOpen(false);
    
    if (!wallet.isInstalled()) {
      setError(`${wallet.name} is not installed. Please install it first.`);
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSelectedWallet(wallet);
    
    try {
      const address = await wallet.connect();
      if (address) {
        setWalletAddress(address);
        setWalletType(wallet.id);
        onWalletConnected?.(address, wallet.id);
      } else {
        setError(`Failed to connect ${wallet.name}. Please try again.`);
      }
    } catch (error) {
      console.error(`${wallet.name} connection failed:`, error);
      setError(`Failed to connect ${wallet.name}. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadBalance = async () => {
    if (!walletAddress || walletType !== 'tronlink') return;
    
    try {
      const walletBalance = await tronPaymentService.getWalletBalance(walletAddress);
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const processPayment = async () => {
    if (!walletAddress || !plan || !userId || walletType !== 'tronlink') return;
    
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

  const openBlockExplorer = () => {
    if (!walletAddress || !walletType) return;
    
    let url = '';
    switch (walletType) {
      case 'tronlink':
        url = `https://tronscan.org/#/address/${walletAddress}`;
        break;
      case 'metamask':
      case 'coinbase':
      case 'trust':
      case 'okx':
      case 'binance':
        url = `https://etherscan.io/address/${walletAddress}`;
        break;
      case 'phantom':
        url = `https://explorer.solana.com/address/${walletAddress}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
  };

  const formatAddress = (address: string, type: string) => {
    if (type === 'tronlink') {
      return formatTronAddress(address);
    }
    // For other wallets, show first 6 and last 4 characters
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const disconnect = () => {
    setWalletAddress(null);
    setWalletType(null);
    setSelectedWallet(null);
    setBalance(null);
    setError(null);
  };

  const installWallet = (wallet: WalletOption) => {
    window.open(wallet.installUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {!walletAddress ? (
        <div className="p-6 border border-gray-200 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Connect Wallet</h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Choose your preferred wallet to connect and authenticate.
          </p>

          {/* Wallet Dropdown */}
          <div className="relative" id="wallet-dropdown">
            <Button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isConnecting}
              variant="outline"
              className="w-full justify-between h-12 text-left"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {isConnecting ? 'Connecting...' : 'Select a wallet'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wide">
                    Available Wallets
                  </div>
                  
                  {walletOptions.map((wallet) => {
                    const isInstalled = wallet.isInstalled();
                    return (
                      <div
                        key={wallet.id}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer group ${
                          !isInstalled ? 'opacity-60' : ''
                        }`}
                        onClick={() => isInstalled ? handleWalletSelect(wallet) : installWallet(wallet)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {wallet.name}
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded-full text-gray-600 dark:text-gray-400">
                                {wallet.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {wallet.description}
                            </div>
                          </div>
                        </div>
                        
                        {!isInstalled && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                            Install
                          </div>
                        )}
                        
                        {isInstalled && wallet.id === 'tronlink' && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Payments
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Wallet Connected</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
            >
              Disconnect
            </Button>
          </div>
          
          {/* Wallet Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-green-800 dark:text-green-200">
                Connected Wallet
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{selectedWallet?.icon}</span>
                <span className="font-medium">{selectedWallet?.name}</span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ({selectedWallet?.type.toUpperCase()})
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-green-800 dark:text-green-200">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded text-sm">
                  {formatAddress(walletAddress, walletType || '')}
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
                  onClick={openBlockExplorer}
                  className="border-green-300 dark:border-green-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Balance (only for TronLink) */}
            {balance && walletType === 'tronlink' && (
              <div>
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

            {/* Payment Button (only for TronLink with subscription plans) */}
            {plan && userId && walletType === 'tronlink' && (
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

            {/* Info for non-payment wallets */}
            {walletType !== 'tronlink' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Payments are currently only supported through TronLink wallet with USDT. 
                  Other wallets can be used for authentication only.
                </p>
              </div>
            )}
          </div>
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