"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationContainer } from "@/components/ui/notification-toast";
import { LanguageProvider, LanguageContextCheck } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import { BillingModal } from '@/components/modals/billing-modal';
import { usageService } from '@/lib/usage-service';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ContextWrapper } from '@/components/ui/context-wrapper';

const inter = Inter({ subsets: ["latin"] });

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
// const network = WalletAdapterNetwork.Mainnet;
const endpoint = 'https://api.mainnet-beta.solana.com';

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showBilling, setShowBilling] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Show billing modal if not paid
    const userId = localStorage.getItem('wallet_address') || localStorage.getItem('user_id') || 'local';
    const sub = usageService.getUserSubscription(userId);
    if (sub.tier === 'none') {
      setShowBilling(true);
    }
    setIsReady(true);
  }, []);

  const handleBillingClose = () => {
    setShowBilling(false);
    // Do not redirect to /pricing anymore
  };

  // Don't render until ready
  if (!isReady) {
    return (
      <div className={`${inter.className} h-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white antialiased`}>
        <div className="min-h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} h-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white antialiased`}>
      <div className="min-h-full flex flex-col">
        <ErrorBoundary>
          <LanguageProvider>
            <LanguageContextCheck>
              <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                    <ContextWrapper>
                      {children}
                      <BillingModal open={showBilling} onOpenChange={open => { if (!open) handleBillingClose(); }} />
                      <NotificationContainer />
                      <Analytics />
                    </ContextWrapper>
                  </WalletModalProvider>
                </WalletProvider>
              </ConnectionProvider>
            </LanguageContextCheck>
          </LanguageProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
} 