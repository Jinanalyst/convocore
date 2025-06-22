"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Zap, ExternalLink } from 'lucide-react';

interface WalletLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  detectMethod: () => boolean;
  connectMethod: () => Promise<void>;
}

export function WalletLoginModal({ open, onOpenChange }: WalletLoginModalProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const walletOptions: WalletOption[] = [
    {
      id: 'tronlink',
      name: 'TronLink',
      icon: '🔗',
      description: 'Connect using TronLink wallet',
      downloadUrl: 'https://www.tronlink.org/',
      detectMethod: () => typeof window !== 'undefined' && !!(window as any).tronWeb,
      connectMethod: async () => {
        const tronWeb = (window as any).tronWeb;
        const accounts = await tronWeb.request({
          method: 'tron_requestAccounts'
        });
        if (accounts && accounts.length > 0) {
          console.log('Connected to TronLink:', accounts[0]);
          onOpenChange(false);
          window.location.href = '/convocore';
        }
      }
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      downloadUrl: 'https://metamask.io/',
      detectMethod: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
      connectMethod: async () => {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts && accounts.length > 0) {
          console.log('Connected to MetaMask:', accounts[0]);
          onOpenChange(false);
          window.location.href = '/convocore';
        }
      }
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Connect using Phantom wallet',
      downloadUrl: 'https://phantom.app/',
      detectMethod: () => typeof window !== 'undefined' && !!(window as any).phantom?.solana,
      connectMethod: async () => {
        const phantom = (window as any).phantom?.solana;
        const response = await phantom.connect();
        if (response.publicKey) {
          console.log('Connected to Phantom:', response.publicKey.toString());
          onOpenChange(false);
          window.location.href = '/convocore';
        }
      }
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      downloadUrl: 'https://trustwallet.com/',
      detectMethod: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isTrust,
      connectMethod: async () => {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts && accounts.length > 0) {
          console.log('Connected to Trust Wallet:', accounts[0]);
          onOpenChange(false);
          window.location.href = '/convocore';
        }
      }
    }
  ];

  const handleConnectWallet = async (wallet: WalletOption) => {
    setIsConnecting(wallet.id);
    try {
      if (wallet.detectMethod()) {
        await wallet.connectMethod();
      } else {
        // Wallet not installed
        const install = confirm(`${wallet.name} is not installed. Would you like to download it?`);
        if (install) {
          window.open(wallet.downloadUrl, '_blank');
        }
      }
    } catch (error) {
      console.error(`Failed to connect ${wallet.name}:`, error);
      alert(`Failed to connect ${wallet.name}. Please try again.`);
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Connect your wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred wallet to access Convocore
            </p>
          </div>

          <div className="space-y-3">
            {walletOptions.map((wallet) => {
              const isInstalled = wallet.detectMethod();
              const isWalletConnecting = isConnecting === wallet.id;
              
              return (
                <Button
                  key={wallet.id}
                  onClick={() => handleConnectWallet(wallet)}
                  disabled={!!isConnecting}
                  variant="outline"
                  className="w-full h-16 justify-start bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="text-2xl">{wallet.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {wallet.name}
                        {!isInstalled && (
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isInstalled ? wallet.description : 'Not installed'}
                      </div>
                    </div>
                    {isWalletConnecting && (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Secure
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Fast
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Web3
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By connecting, you agree to our{' '}
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:underline">
                terms of service
              </a>{' '}
              and{' '}
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:underline">
                privacy policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 