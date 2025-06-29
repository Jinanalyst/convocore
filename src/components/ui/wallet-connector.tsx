"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Copy, Check, ChevronDown, ChevronUp, Smartphone, Monitor, AlertCircle, X, CheckCircle } from "lucide-react";
import { tronPaymentService, formatTronAddress, CONVO_AI_RECIPIENT_ADDRESS } from "@/lib/blockchain";
import { ConvoAILogo } from "@/components/ui/convoai-logo";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'tron' | 'ethereum' | 'solana' | 'bitcoin';
  installUrl: string;
  mobileInstallUrl?: string;
  isInstalled: () => boolean;
  connect: () => Promise<string | null>;
  supportsMobile: boolean;
  deepLink?: string;
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
  const [isMobile, setIsMobile] = useState(false);
  const [installedWallets, setInstalledWallets] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting to prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Updated wallet options with better detection - MOVED BEFORE useEffect
  const walletOptions: WalletOption[] = [
    {
      id: 'tronlink',
      name: 'TronLink',
      icon: '🔗',
      description: 'TRON blockchain wallet for USDT payments',
      type: 'tron',
      installUrl: 'https://www.tronlink.org/',
      mobileInstallUrl: 'https://www.tronlink.org/dlDetails/',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).tronLink || !!(window as any).tronWeb || !!(window as any).tron;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        // Try multiple TronLink detection methods
        const tronLink = (window as any).tronLink;
        const tronWeb = (window as any).tronWeb;
        
        if (tronLink) {
          try {
            const result = await tronPaymentService.connectWallet();
            console.log('TronLink connection result:', result);
            return result;
          } catch (error) {
            console.error('TronLink connection error:', error);
            return null;
          }
        } else if (tronWeb) {
          try {
            if (tronWeb.defaultAddress?.base58) {
              return tronWeb.defaultAddress.base58;
            }
          } catch (error) {
            console.error('TronWeb connection error:', error);
          }
        }
        
        return null;
      },
      supportsMobile: true,
      deepLink: 'tronlinkoutside://pull.activity'
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Popular Ethereum wallet',
      type: 'ethereum',
      installUrl: 'https://metamask.io/',
      mobileInstallUrl: 'https://metamask.app.link/dapp/',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).ethereum?.isMetaMask || !!(window as any).web3?.currentProvider?.isMetaMask;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const ethereum = (window as any).ethereum;
        if (!ethereum?.isMetaMask) return null;
        
        try {
          console.log('Attempting MetaMask connection...');
          const accounts = await ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          console.log('MetaMask accounts:', accounts);
          return accounts[0] || null;
        } catch (error) {
          console.error('MetaMask connection failed:', error);
          return null;
        }
      },
      supportsMobile: true,
      deepLink: 'https://metamask.app.link/dapp/'
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Solana blockchain wallet',
      type: 'solana',
      installUrl: 'https://phantom.app/',
      mobileInstallUrl: 'https://phantom.app/download',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).solana?.isPhantom || 
               !!(window as any).phantom?.solana ||
               !!(window as any).phantom;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const solana = (window as any).solana || (window as any).phantom?.solana;
        if (!solana?.isPhantom) return null;
        
        try {
          console.log('Attempting Phantom connection...');
          const response = await solana.connect();
          console.log('Phantom connection response:', response);
          return response.publicKey.toString();
        } catch (error) {
          console.error('Phantom connection failed:', error);
          return null;
        }
      },
      supportsMobile: true,
      deepLink: 'phantom://browse/'
    },
    {
      id: 'convoai',
      name: 'ConvoAI Token',
      icon: '🤖',
      description: 'ConvoAI Token payment integration',
      type: 'solana',
      installUrl: 'https://phantom.app/',
      mobileInstallUrl: 'https://phantom.app/download',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).solana?.isPhantom || 
               !!(window as any).phantom?.solana ||
               !!(window as any).phantom;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const solana = (window as any).solana || (window as any).phantom?.solana;
        if (!solana?.isPhantom) return null;
        
        try {
          console.log('Attempting ConvoAI Token connection...');
          const response = await solana.connect();
          console.log('ConvoAI Token connection response:', response);
          return response.publicKey.toString();
        } catch (error) {
          console.error('ConvoAI Token connection failed:', error);
          return null;
        }
      },
      supportsMobile: true,
      deepLink: 'phantom://browse/'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔄',
      description: 'Connect any mobile wallet',
      type: 'ethereum',
      installUrl: 'https://walletconnect.com/',
      isInstalled: () => true, // Always available as it's a protocol
      connect: async () => {
        console.log('WalletConnect connection would require SDK integration');
        // TODO: Implement actual WalletConnect SDK
        return null;
      },
      supportsMobile: true
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Coinbase\'s self-custody wallet',
      type: 'ethereum',
      installUrl: 'https://wallet.coinbase.com/',
      mobileInstallUrl: 'https://wallet.coinbase.com/download',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).ethereum?.isCoinbaseWallet || 
               !!(window as any).coinbaseWalletExtension ||
               !!(window as any).ethereum?.selectedProvider?.isCoinbaseWallet;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const ethereum = (window as any).ethereum;
        if (!ethereum?.isCoinbaseWallet) return null;
        
        try {
          console.log('Attempting Coinbase Wallet connection...');
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          console.log('Coinbase Wallet accounts:', accounts);
          return accounts[0] || null;
        } catch (error) {
          console.error('Coinbase Wallet connection failed:', error);
          return null;
        }
      },
      supportsMobile: true
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Multi-chain mobile wallet',
      type: 'ethereum',
      installUrl: 'https://trustwallet.com/',
      mobileInstallUrl: 'https://link.trustwallet.com/open_url',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).ethereum?.isTrust || 
               !!(window as any).trustwallet ||
               !!(window as any).ethereum?.isTrustWallet;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const ethereum = (window as any).ethereum;
        if (!ethereum?.isTrust) return null;
        
        try {
          console.log('Attempting Trust Wallet connection...');
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          console.log('Trust Wallet accounts:', accounts);
          return accounts[0] || null;
        } catch (error) {
          console.error('Trust Wallet connection failed:', error);
          return null;
        }
      },
      supportsMobile: true,
      deepLink: 'trust://open_url'
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: '⭕',
      description: 'Multi-chain crypto wallet',
      type: 'ethereum',
      installUrl: 'https://www.okx.com/web3',
      mobileInstallUrl: 'https://www.okx.com/download',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        return !!(window as any).okxwallet || 
               !!(window as any).okexchain ||
               !!(window as any).ethereum?.isOKExWallet;
      },
      connect: async () => {
        if (typeof window === 'undefined') return null;
        
        const okxwallet = (window as any).okxwallet;
        if (!okxwallet) return null;
        
        try {
          console.log('Attempting OKX Wallet connection...');
          const accounts = await okxwallet.request({ method: 'eth_requestAccounts' });
          console.log('OKX Wallet accounts:', accounts);
          return accounts[0] || null;
        } catch (error) {
          console.error('OKX Wallet connection failed:', error);
          return null;
        }
      },
      supportsMobile: true
    }
  ];

  // Check if user is on mobile device
  useEffect(() => {
    if (!isMounted) return;
    
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMounted]);

  // Enhanced wallet detection with comprehensive methods
  useEffect(() => {
    if (!isMounted) return;
    
    const detectInstalledWallets = async () => {
      const detected = new Set<string>();
      
      // Wait for wallets to inject themselves
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 Starting wallet detection...');
      if (typeof window !== 'undefined') {
        console.log('Window object keys:', Object.keys(window).filter(key => 
          key.toLowerCase().includes('wallet') || 
          key.toLowerCase().includes('ethereum') || 
          key.toLowerCase().includes('solana') || 
          key.toLowerCase().includes('tron') ||
          key.toLowerCase().includes('phantom') ||
          key.toLowerCase().includes('metamask')
        ));
      }
      
      // Check for each wallet with improved detection
      walletOptions.forEach(wallet => {
        try {
          let isInstalled = false;
          
          // Enhanced detection based on wallet type
          switch (wallet.id) {
            case 'tronlink':
              isInstalled = !!(window as any).tronLink || 
                           !!(window as any).tronWeb || 
                           !!(window as any).tron;
              if (isInstalled) {
                console.log('TronLink detection details:', {
                  tronLink: !!(window as any).tronLink,
                  tronWeb: !!(window as any).tronWeb,
                  tron: !!(window as any).tron,
                  ready: (window as any).tronLink?.ready
                });
              }
              break;
              
            case 'metamask':
              isInstalled = !!(window as any).ethereum?.isMetaMask ||
                           !!(window as any).web3?.currentProvider?.isMetaMask;
              if (isInstalled) {
                console.log('MetaMask detection details:', {
                  ethereum: !!(window as any).ethereum,
                  isMetaMask: (window as any).ethereum?.isMetaMask,
                  web3: !!(window as any).web3
                });
              }
              break;
              
            case 'phantom':
              isInstalled = !!(window as any).solana?.isPhantom ||
                           !!(window as any).phantom?.solana ||
                           !!(window as any).phantom;
              if (isInstalled) {
                console.log('Phantom detection details:', {
                  solana: !!(window as any).solana,
                  isPhantom: (window as any).solana?.isPhantom,
                  phantom: !!(window as any).phantom
                });
              }
              break;
              
            case 'coinbase':
              isInstalled = !!(window as any).ethereum?.isCoinbaseWallet ||
                           !!(window as any).coinbaseWalletExtension ||
                           !!(window as any).ethereum?.selectedProvider?.isCoinbaseWallet;
              break;
              
            case 'trust':
              isInstalled = !!(window as any).ethereum?.isTrust ||
                           !!(window as any).trustwallet ||
                           !!(window as any).ethereum?.isTrustWallet;
              break;
              
            case 'okx':
              isInstalled = !!(window as any).okxwallet ||
                           !!(window as any).okexchain ||
                           !!(window as any).ethereum?.isOKExWallet;
              break;
              
            case 'walletconnect':
              // WalletConnect is always available as it's a protocol
              isInstalled = true;
              break;
              
            default:
              isInstalled = wallet.isInstalled();
          }
          
          if (isInstalled) {
            detected.add(wallet.id);
            console.log(`✅ Detected ${wallet.name} wallet`);
          } else {
            console.log(`❌ ${wallet.name} not detected`);
          }
        } catch (error) {
          console.log(`❌ Error detecting ${wallet.name}:`, error);
        }
      });
      
      // Additional global detection check
      if (typeof window !== 'undefined') {
        console.log('🌐 Global wallet objects:', {
          ethereum: !!(window as any).ethereum,
          tronLink: !!(window as any).tronLink,
          solana: !!(window as any).solana,
          phantom: !!(window as any).phantom,
          okxwallet: !!(window as any).okxwallet,
          coinbaseWalletExtension: !!(window as any).coinbaseWalletExtension,
          trustwallet: !!(window as any).trustwallet
        });
      }
      
      console.log(`🎯 Detected ${detected.size} wallets:`, Array.from(detected));
      setInstalledWallets(detected);
    };

    // Initial detection
    detectInstalledWallets();
    
    // Re-check periodically for newly installed wallets
    const interval = setInterval(detectInstalledWallets, 3000);
    
    // Listen for wallet events
    const handleWalletEvents = () => {
      console.log('👂 Wallet event detected, re-checking...');
      detectInstalledWallets();
    };

    // Listen for common wallet injection events
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleWalletEvents);
      window.addEventListener('tronLink#initialized', handleWalletEvents);
      window.addEventListener('load', handleWalletEvents);
    }
    
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ethereum#initialized', handleWalletEvents);
        window.removeEventListener('tronLink#initialized', handleWalletEvents);
        window.removeEventListener('load', handleWalletEvents);
      }
    };
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      checkWalletConnection();
    }
  }, [isMounted]);

  useEffect(() => {
    if (walletAddress && walletType === 'tronlink') {
      loadBalance();
    }
  }, [walletAddress, walletType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMounted) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('wallet-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMounted]);

  const checkWalletConnection = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Check TronLink first (for backward compatibility)
      if ((window as any).tronLink?.ready) {
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
      if (isMobile && wallet.mobileInstallUrl) {
        setError(`${wallet.name} is not installed. Redirecting to mobile app store...`);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.open(wallet.mobileInstallUrl!, '_blank');
          }
        }, 1000);
      } else {
        setError(`${wallet.name} is not installed. Please install it first.`);
      }
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
        
        // Store wallet connection info
        localStorage.setItem('wallet-connected', 'true');
        localStorage.setItem('wallet-public-key', address);
        localStorage.setItem('wallet-type', wallet.id);
        
        // Mobile-specific flow: skip session key, go directly to chat
        if (isMobile) {
          console.log('Mobile wallet connected, redirecting directly to chat interface');
          if (typeof window !== 'undefined') {
            window.location.href = '/chat';
          }
        } else {
          // Desktop flow: redirect to convocore for session key setup
          console.log('Desktop wallet connected, redirecting to /convocore for session key setup');
          if (typeof window !== 'undefined') {
            window.location.href = '/convocore';
          }
        }
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
    if (walletAddress && typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openBlockExplorer = () => {
    if (!walletAddress || !walletType || typeof window === 'undefined') return;
    
    let url = '';
    switch (walletType) {
      case 'tronlink':
        url = `https://tronscan.org/#/address/${walletAddress}`;
        break;
      case 'metamask':
      case 'coinbase':
      case 'trust':
      case 'okx':
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
    if (typeof window === 'undefined') return;
    
    const installUrl = isMobile && wallet.mobileInstallUrl ? wallet.mobileInstallUrl : wallet.installUrl;
    window.open(installUrl, '_blank');
  };

  // Filter and sort wallets: installed first, then by mobile support
  const filteredWallets = isMobile ? walletOptions.filter(wallet => wallet.supportsMobile) : walletOptions;
  const sortedWallets = [...filteredWallets].sort((a, b) => {
    const aInstalled = installedWallets.has(a.id);
    const bInstalled = installedWallets.has(b.id);
    
    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return 0;
  });

  // Render loading state during SSR
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="p-4 md:p-6 border border-gray-200 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Connect Wallet</h3>
          </div>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!walletAddress ? (
        <div className="p-4 md:p-6 border border-gray-200 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Connect Wallet</h3>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              <span>{isMobile ? 'Mobile' : 'Desktop'}</span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Choose your preferred wallet to connect and authenticate.
          </p>

          {/* Unified dropdown for both mobile and desktop */}
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
              {isMobile ? (
                <ChevronUp className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </Button>

            {/* Drop-up/Dropdown Menu */}
            {isDropdownOpen && (
              <div className={`absolute left-0 right-0 ${isMobile ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto`}>
                <div className="p-2">
                  {/* Mobile close button */}
                  {isMobile && (
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-700 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Select Wallet</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDropdownOpen(false)}
                        className="p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Detected wallets section */}
                  {installedWallets.size > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 px-3 py-2 uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        Detected Wallets
                      </div>
                      
                      {sortedWallets.filter(wallet => installedWallets.has(wallet.id)).map((wallet) => (
                        <div
                          key={wallet.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 cursor-pointer group transition-all min-h-[60px]"
                          onClick={() => handleWalletSelect(wallet)}
                        >
                          <div className="flex-shrink-0">
                            {wallet.id === 'convoai' ? (
                              <ConvoAILogo className="w-8 h-8" />
                            ) : (
                              <span className="text-xl">{wallet.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span className="truncate">{wallet.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded-full text-green-700 dark:text-green-300 flex-shrink-0">
                                READY
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {isMobile ? 'Tap to connect' : wallet.description}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <div className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors min-w-[70px] text-center">
                              Connect
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available wallets section */}
                  {sortedWallets.filter(wallet => !installedWallets.has(wallet.id)).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wide flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Available Wallets
                      </div>
                      
                      {sortedWallets.filter(wallet => !installedWallets.has(wallet.id)).map((wallet) => (
                        <div
                          key={wallet.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer group opacity-70 transition-all min-h-[60px]"
                          onClick={() => installWallet(wallet)}
                        >
                          <div className="flex-shrink-0">
                            {wallet.id === 'convoai' ? (
                              <ConvoAILogo className="w-8 h-8 opacity-60" />
                            ) : (
                              <span className="text-xl opacity-60">{wallet.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span className="truncate">{wallet.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded-full text-gray-600 dark:text-gray-400 flex-shrink-0">
                                {wallet.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {wallet.description}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <div className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors min-w-[70px] text-center group-hover:bg-blue-700">
                              Install
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No wallets detected message */}
                  {installedWallets.size === 0 && (
                    <div className="p-3 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        No wallets detected
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                        {isMobile 
                          ? 'Install a wallet app to get started. Choose one below:'
                          : 'Install a wallet extension to get started'
                        }
                      </p>
                      {isMobile && (
                        <div className="space-y-3">
                          {walletOptions.filter(w => w.supportsMobile).map(wallet => (
                            <div key={wallet.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 mb-1">
                              <div className="flex items-center gap-2">
                                {wallet.id === 'convoai' ? (
                                  <ConvoAILogo className="w-7 h-7" />
                                ) : (
                                  <span className="text-2xl">{wallet.icon}</span>
                                )}
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{wallet.name}</span>
                              </div>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                                onClick={() => installWallet(wallet)}
                              >
                                Install
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile-specific tips */}
          {isMobile && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Mobile Tip:</strong> For the best experience, open this page from your wallet's built-in browser after installing the app.
                </div>
              </div>
            </div>
          )}

          {/* Debug Section - Safe for SSR */}
          {typeof window !== 'undefined' && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🔍 Wallet Detection Debug
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Manual wallet detection triggered');
                    window.location.reload();
                  }}
                  className="text-xs"
                >
                  Refresh Detection
                </Button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Detected: {installedWallets.size} wallets</div>
                <div>Browser: {isMobile ? 'Mobile' : 'Desktop'}</div>
                <div>Window objects: {Object.keys(window).filter(key => 
                  key.toLowerCase().includes('wallet') || 
                  key.toLowerCase().includes('ethereum') || 
                  key.toLowerCase().includes('solana') || 
                  key.toLowerCase().includes('tron') ||
                  key.toLowerCase().includes('phantom')
                ).join(', ') || 'None found'}</div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 dark:text-blue-400">View Detection Details</summary>
                  <div className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded text-xs font-mono">
                    {JSON.stringify({
                      ethereum: !!(window as any).ethereum,
                      'ethereum.isMetaMask': !!(window as any).ethereum?.isMetaMask,
                      'ethereum.isCoinbaseWallet': !!(window as any).ethereum?.isCoinbaseWallet,
                      'ethereum.isTrust': !!(window as any).ethereum?.isTrust,
                      tronLink: !!(window as any).tronLink,
                      tronWeb: !!(window as any).tronWeb,
                      'solana.isPhantom': !!(window as any).solana?.isPhantom,
                      phantom: !!(window as any).phantom,
                      okxwallet: !!(window as any).okxwallet,
                      installedCount: installedWallets.size,
                      detectedWallets: Array.from(installedWallets)
                    }, null, 2)}
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 md:p-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm md:text-base">Wallet Connected</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 text-xs md:text-sm"
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
                <span className="font-medium text-sm md:text-base">{selectedWallet?.name}</span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  ({selectedWallet?.type.toUpperCase()})
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-green-800 dark:text-green-200">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded text-xs md:text-sm font-mono">
                  {formatAddress(walletAddress, walletType || '')}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="border-green-300 dark:border-green-700 p-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBlockExplorer}
                  className="border-green-300 dark:border-green-700 p-2"
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