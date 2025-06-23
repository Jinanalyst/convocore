import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationContainer } from "@/components/ui/notification-toast";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Convocore",
    default: "Convocore - AI Meets Web3"
  },
  description: "AI chat with blockchain payments. Secure USDT payments on multiple blockchains.",
  keywords: [
    "AI chat", "conversational AI", "blockchain payments", "USDT payments", "TRON", "Ethereum", "BSC", "Polygon",
    "Web3 AI", "code generation", "smart contracts", "crypto payments", "AI assistant", "PayPal payments",
    "AI chat with USDT payments", "blockchain AI assistant", "multi-chain AI platform"
  ],
  authors: [{ name: "Convocore Team" }],
  creator: "Convocore",
  publisher: "Convocore",
  metadataBase: new URL('https://convocore.site'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://convocore.site',
    siteName: 'Convocore',
    title: 'Convocore - AI Meets Web3',
    description: 'AI chat with blockchain payments. Secure USDT payments on multiple blockchains.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Convocore - AI Meets Web3',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convocore - AI Meets Web3',
    description: 'AI chat with blockchain payments. Secure USDT payments on multiple blockchains.',
    images: ['/twitter-image.png'],
    creator: '@convocore',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
  classification: 'AI, Blockchain, Web3, Chat, Payments',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <AuthProvider>
              <LanguageProvider>
                {children}
                <NotificationContainer />
              </LanguageProvider>
            </AuthProvider>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
