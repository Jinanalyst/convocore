import { MobilePricingSection } from '../../components/ui/MobilePricingSection';
import { ConvoAILogo } from '@/components/ui/convoai-logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';

export default function MobilePricingPage() {
  return (
    <div className="block md:hidden w-full min-h-screen bg-white dark:bg-black">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <ConvoAILogo className="w-8 h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/convocore">Try Chat</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center py-8 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-6">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Pay with ConvoAI Token
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-3 text-gray-900 dark:text-white">
          Transparent Pricing
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center px-4 mb-6 leading-relaxed">
          Choose the perfect plan for your AI conversation needs. One-time payments, no subscriptions.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            <span>No Hidden Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Premium AI Models</span>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="flex flex-col gap-8 px-4 pb-8">
        <MobilePricingSection />
        
        {/* Additional Features Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              What's Included
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              All plans include these premium features
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
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

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    End-to-End Encryption
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your conversations are encrypted and private. No data mining or tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Blockchain Payments
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Pay with Solana ConvoAI Token. Instant settlements, no intermediaries.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Mobile & Desktop
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Seamless experience across all devices with native mobile app support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of users who trust Convocore for their AI conversations
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/convocore">
                Try Demo First
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
} 