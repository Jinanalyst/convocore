"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationContainer } from "@/components/ui/notification-toast";
import { LanguageProvider } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Analytics } from "@vercel/analytics/react";
import { BillingModal } from '@/components/modals/billing-modal';
import { usageService } from '@/lib/usage-service';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const inter = Inter({ subsets: ["latin"] });

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const network = WalletAdapterNetwork.Mainnet;
const endpoint = 'https://api.mainnet-beta.solana.com';

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showBilling, setShowBilling] = useState(false);

  useEffect(() => {
    // Show billing modal if not paid
    const userId = localStorage.getItem('wallet_address') || localStorage.getItem('user_id') || 'local';
    const sub = usageService.getUserSubscription(userId);
    if (sub.tier === 'none') {
      setShowBilling(true);
    }
  }, []);

  const handleBillingClose = () => {
    setShowBilling(false);
    // Do not redirect to /pricing anymore
  };

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.trongrid.io" />
        <link rel="preconnect" href="https://apilist.tronscan.org" />
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Convocore",
              "description": "AI chat with blockchain payments",
              "url": "https://convocore.site",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Free Plan",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "3 chats per day"
                },
                {
                  "@type": "Offer", 
                  "name": "Pro Plan",
                  "price": "20",
                  "priceCurrency": "USDT",
                  "description": "Unlimited chats"
                },
                {
                  "@type": "Offer",
                  "name": "Premium Plan", 
                  "price": "40",
                  "priceCurrency": "USDT",
                  "description": "All features plus priority support"
                }
              ],
              "featureList": [
                "AI conversations",
                "Code generation", 
                "Blockchain payments",
                "USDT payments",
                "Real-time responses",
                "Secure and private"
              ]
            })
          }}
        />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white antialiased`}>
        <div className="min-h-full flex flex-col">
          <ErrorBoundary>
            <LanguageProvider>
              <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                    {children}
                    <BillingModal open={showBilling} onOpenChange={open => { if (!open) handleBillingClose(); }} />
                    <NotificationContainer />
                    <Analytics />
                  </WalletModalProvider>
                </WalletProvider>
              </ConnectionProvider>
            </LanguageProvider>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
} 