import { HomeFeaturesSection } from '@/components/ui/home-features-section';
import { MobilePricingSection } from '@/components/ui/MobilePricingSection';
import { ConvoAILogo } from '@/components/ui/convoai-logo';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, Star, ArrowRight, CheckCircle, Zap, Lock, Globe, Smartphone, Sparkles } from "lucide-react";

export default function MobileHomePage() {
  const router = useRouter();
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);
  const [isWalletBrowser, setIsWalletBrowser] = useState(false);

  useEffect(() => {
    // Check for installed wallets
    checkInstalledWallets();
    // Check if user is in a wallet browser
    checkWalletBrowser();
  }, []);

  const checkInstalledWallets = async () => {
    try {
      const response = await fetch('/api/wallet/detect');
      if (response.ok) {
        const data = await response.json();
        setInstalledWallets(data.installedWallets || []);
      }
    } catch (error) {
      console.error('Error checking installed wallets:', error);
    }
  };

  const checkWalletBrowser = async () => {
    try {
      const response = await fetch('/api/wallet/browser-check');
      if (response.ok) {
        const data = await response.json();
        setIsWalletBrowser(data.isWallet || false);
      }
    } catch (error) {
      console.error('Error checking wallet browser:', error);
    }
  };

  const handleStartChatting = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "start_chatting_click", {
        event_category: "CTA",
        event_label: "Mobile Home Hero",
      });
    }
    router.push('/auth/login');
  };

  const handleTryDemo = () => {
    router.push('/convocore');
  };

  return (
    <div className="block md:hidden w-full min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <header className="flex flex-col items-center py-8 px-4">
        <ConvoAILogo className="w-16 h-16 mb-4" />
        <h1 className="text-4xl font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ConvoAI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
          Private AI chat powered by ConvoAI Token. Launch secure conversations in seconds.
        </p>
        
        {/* Wallet Status Badge */}
        {isWalletBrowser && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Wallet Browser Detected
            </span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button 
            onClick={handleStartChatting}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
          >
            Start Secure Chat
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            onClick={handleTryDemo}
            variant="outline"
            className="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-lg"
          >
            Try Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>4.9/5 Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>Zero-knowledge</span>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <main className="flex flex-col gap-8 px-4 pb-8">
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Why Choose Convocore?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Experience the future of AI chat with blockchain-powered payments
            </p>
          </div>

          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Private & Secure
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    End-to-end encryption ensures your conversations stay private. No data mining or tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Multi-Crypto Payments
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Pay with Solana ConvoAI Token. Instant settlements, no intermediaries.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Mobile Optimized
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Seamless experience across all devices. Native mobile app with wallet integration.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Advanced AI Models
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access to GPT-4, Claude 3, and other cutting-edge AI models for superior conversations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wallet Integration Section */}
        {installedWallets.length > 0 && (
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
            <div className="text-center mb-4">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Wallet Detected
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We found {installedWallets.length} wallet{installedWallets.length > 1 ? 's' : ''} on your device
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {installedWallets.map((wallet, index) => (
                <span key={index} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                  {wallet}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Section */}
        <MobilePricingSection />
      </main>
    </div>
  );
} 