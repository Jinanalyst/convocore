import type { Metadata } from "next";
import { PricingSection } from "@/components/ui/pricing-section";
import { ConvoAILogo } from "@/components/ui/convo-ai-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing Plans - Affordable AI Chat with USDT Payments | Convocore",
  description: "Choose the perfect AI chat plan for your needs. Pro plan at 20 USDT/month, Premium at 40 USDT/month. Secure blockchain payments, unlimited requests, advanced AI models including GPT-4 and Claude 3. Start with free plan today!",
  keywords: [
    "AI chat pricing",
    "USDT subscription",
    "blockchain payments",
    "AI assistant cost",
    "crypto payments",
    "AI pricing plans",
    "TRON payments",
    "affordable AI",
    "AI subscription",
    "GPT-4 pricing",
    "Claude 3 pricing",
    "Web3 AI pricing",
    "cryptocurrency subscription",
    "decentralized AI",
    "AI chat plans"
  ],
  openGraph: {
    title: "Convocore Pricing - AI Chat Plans with USDT Payments | Pro & Premium",
    description: "Transparent pricing for advanced AI chat. Pro plan 20 USDT, Premium 40 USDT. Pay with crypto, get unlimited AI access with GPT-4, Claude 3, and more. Free plan available!",
    url: "https://convocore.site/pricing",
    type: "website",
  },
  twitter: {
    title: "Convocore Pricing - AI Chat Plans with USDT",
    description: "Transparent AI chat pricing. Pro: 20 USDT, Premium: 40 USDT. Secure crypto payments with unlimited AI access.",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/">
            <ConvoAILogo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    <Link href="/convocore">Try Chat</Link>
            </Button>
            <Button asChild size="sm" className="text-sm">
              <Link href="/auth/login">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
} 