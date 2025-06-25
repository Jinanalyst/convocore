import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convocore - AI Chat with Multiple Blockchain Payments",
  description: "Experience powerful AI conversations with advanced models including GPT-4 and Claude 3. Code generation, problem solving, creative writing, and more. Secure payments via PayPal or USDT on multiple blockchains.",
  keywords: [
    "AI chat",
    "conversational AI", 
    "code generation",
    "AI assistant",
    "artificial intelligence",
    "smart chat",
    "AI conversation",
    "machine learning chat",
    "intelligent assistant",
    "AI help",
    "GPT-4 chat",
    "Claude 3 chat",
    "programming assistant",
    "code debugging",
    "Web3 AI",
    "blockchain payments",
    "USDT payments",
    "PayPal payments",
    "multi-chain AI"
  ],
  openGraph: {
    title: "Convocore - AI Chat with Multiple Blockchain Payments",
    description: "Powerful AI conversations with GPT-4, Claude 3, and more. Code generation, problem solving, and creative assistance. Secure payments via PayPal or USDT on multiple blockchains.",
    url: "https://convocore.site/convocore",
    type: "website",
  },
  twitter: {
    title: "Convocore - Advanced AI Chat Platform",
    description: "Advanced AI conversations with code generation, debugging, and intelligent assistance. Powered by GPT-4, Claude 3, and Web3 technology with flexible payment options.",
  },
  alternates: {
    canonical: "/convocore",
  },
};

export default function ConvocoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 