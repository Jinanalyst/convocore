"use client";

import type { Metadata } from "next";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { AuroraBackground } from "@/components/ui/aurora-background";

// Note: Since this is a client component, metadata should be in layout.tsx
// This is just for reference - the actual metadata is in layout.tsx

export default function Home() {
  const router = useRouter();

  const handleStartChatting = () => {
    router.push('/auth/login');
  };

  return (
    <>
      {/* Hidden SEO content for search engines */}
      <div className="sr-only">
        <h1>Convocore - Where AI Meets Web3</h1>
        <p>
          Advanced AI chat platform with blockchain payments. Experience intelligent 
          conversations powered by cutting-edge AI models including GPT-4, Claude 3, 
          and more. Secure USDT payments on TRON blockchain.
        </p>
        <h2>Features</h2>
        <ul>
          <li>Advanced AI Models (GPT-4, Claude 3, Gemini Pro)</li>
          <li>Code Generation and Debugging</li>
          <li>Blockchain Payments with USDT</li>
          <li>Smart Contract Integration</li>
          <li>Multi-wallet Support (TronLink, MetaMask, Phantom)</li>
          <li>Real-time Streaming Responses</li>
          <li>Secure Authentication</li>
          <li>Conversation History</li>
        </ul>
        <h2>Pricing Plans</h2>
        <div>
          <h3>Pro Plan - 20 USDT/month</h3>
          <p>Unlimited AI requests, advanced models, API access, email support</p>
          <h3>Premium Plan - 40 USDT/month</h3>
          <p>Everything in Pro plus priority support, custom agents, team collaboration</p>
        </div>
      </div>

      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <header className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold dark:text-white text-center text-black leading-tight">
              Where AI Meets Web3
            </h1>
            <p className="font-extralight text-base sm:text-lg md:text-xl dark:text-neutral-200 py-4 max-w-[280px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[700px] text-center text-gray-600 mx-auto leading-relaxed">
              Chat smarter, code faster, pay seamlessly with USDT. Experience the future of intelligent conversations with advanced AI models, blockchain payments, and powerful features.
            </p>
          </header>
          
          <nav className="mt-6 sm:mt-8">
            <button 
              onClick={handleStartChatting}
              className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-6 sm:px-8 py-3 sm:py-3.5 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              aria-label="Start chatting with AI - Sign up or log in to begin"
            >
              Start Chatting Now
            </button>
          </nav>

          {/* Features section for SEO */}
          <section className="mt-12 sm:mt-16 w-full max-w-6xl mx-auto text-center" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-sm">
              <div className="flex flex-col items-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">AI</span>
                </div>
                <h3 className="font-semibold dark:text-white text-black mb-2 text-base sm:text-lg">Advanced AI Models</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  Access to GPT-4, Claude 3, and other cutting-edge AI models
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">₿</span>
                </div>
                <h3 className="font-semibold dark:text-white text-black mb-2 text-base sm:text-lg">Crypto Payments</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  Secure USDT payments on TRON blockchain
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">⚡</span>
                </div>
                <h3 className="font-semibold dark:text-white text-black mb-2 text-base sm:text-lg">Real-time Chat</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  Instant responses with streaming AI conversations
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </AuroraBackground>
    </>
  );
}
