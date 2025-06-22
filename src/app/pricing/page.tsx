import { PricingSection } from "@/components/ui/pricing-section";
import { ConvoAILogo } from "@/components/ui/convo-ai-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <ConvoAILogo />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/chat">Try Chat</Link>
            </Button>
            <Button asChild>
              <Link href="/chat">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
} 