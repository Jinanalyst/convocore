import type { Metadata, Viewport } from "next";
import ClientRootLayout from './client-root-layout';

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
    'msapplication-TileColor': '#667eea',
    'theme-color': '#764ba2',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#764ba2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
