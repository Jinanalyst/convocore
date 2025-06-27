"use client";

import type { Metadata } from "next";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { BackgroundPaths } from "@/components/ui/background-paths";
import { PWAInstall } from "@/components/ui/pwa-install";
import { useState, useEffect } from 'react';
import { Hero } from "@/components/ui/hero";
import { SplashScreen } from "@/components/ui/splash-screen";
import { HomeFeaturesSection } from "@/components/ui/home-features-section";
import { HomePricingSection } from "@/components/ui/home-pricing-section";

// Note: Since this is a client component, metadata should be in layout.tsx
// This is just for reference - the actual metadata is in layout.tsx

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Show splash screen for PWA or first-time visitors
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;
    
    const isFirstVisit = !localStorage.getItem('convocore-visited');
    
    if (isPWA || isFirstVisit) {
      setShowSplash(true);
      localStorage.setItem('convocore-visited', 'true');
    }
  }, []);

  const handleStartChatting = () => {
    router.push('/auth/login');
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      <BackgroundPaths>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 sm:gap-6 items-center justify-center px-4 sm:px-6 lg:px-8 text-center min-h-[70vh] safe-area-top safe-area-bottom"
      >
        {/* Main Title - Enhanced for Mobile */}
        <div className={`font-bold dark:text-white text-center max-w-4xl mx-auto leading-tight ${
          isMobile 
            ? 'text-2xl sm:text-3xl leading-tight' 
            : 'text-2xl sm:text-3xl md:text-5xl lg:text-7xl'
        }`}>
          <span className="block">Where AI</span>
          <span className="block text-blue-500 dark:text-blue-400">Meets Web3</span>
        </div>
        
        {/* Subtitle - Enhanced for Mobile */}
        <div className={`font-extralight dark:text-neutral-200 max-w-3xl mx-auto leading-relaxed ${
          isMobile 
            ? 'text-sm px-6 leading-relaxed' 
            : 'text-sm sm:text-base md:text-xl lg:text-2xl py-4'
        }`}>
          <span className="block">AI chat with secure</span>
                          <span className="block">USDT payments on multiple blockchains.</span>
        </div>
        
        {/* CTA Button - Enhanced for Mobile */}
        <motion.button 
          onClick={handleStartChatting}
          whileHover={{ scale: isMobile ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            bg-black dark:bg-white rounded-full w-fit text-white dark:text-black 
            font-medium transition-all duration-200 shadow-lg hover:shadow-xl
            touch-feedback mobile-transition
            ${isMobile 
              ? 'px-8 py-4 text-base min-h-[48px] min-w-[200px]' 
              : 'px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base'
            }
            hover:bg-gray-800 dark:hover:bg-gray-200 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            active:transform active:scale-95
          `}
        >
          Start Chatting Now
        </motion.button>

        {/* Additional Mobile Features */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-4 px-6 max-w-sm mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Free to start • 3 chats daily</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-center">
                  <div className="text-blue-500 dark:text-blue-400 font-semibold">AI Models</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">GPT-4, Claude 3</div>
                </div>
              </div>
              
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-center">
                  <div className="text-green-500 dark:text-green-400 font-semibold">Payments</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">PayPal & USDT</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PWA Install Component */}
        <PWAInstall />
      </motion.div>
      <Hero />

      {/* Features Section */}
      <HomeFeaturesSection />
      <HomePricingSection />

      {/* Testimonials Section */}
      <section className="w-full py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-12">
            What our users are saying
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial Card 1 */}
            <div className="bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 rounded-lg p-6 flex flex-col justify-between h-full">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                "Convocore seamlessly bridges AI and crypto. The chat quality is top-notch and the on-chain payments just work."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/convocore-logo.svg"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Alice K.</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Solana Developer</p>
                </div>
              </div>
            </div>

            {/* Testimonial Card 2 */}
            <div className="bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 rounded-lg p-6 flex flex-col justify-between h-full">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                "The pay-as-you-go model is perfect for our team. We can top-up with USDT and keep building without worrying about API limits."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/convocore-logo.svg"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Brian L.</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Full-Stack Engineer</p>
                </div>
              </div>
            </div>

            {/* Testimonial Card 3 */}
            <div className="bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 rounded-lg p-6 flex flex-col justify-between h-full">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                "I love the minimal UI and the fact that I can pay with my crypto wallet. It feels futuristic and secure."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/convocore-logo.svg"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Chen W.</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Crypto Enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center rounded-2xl shadow-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/10"
        >
          <div className="py-12 sm:py-16 lg:py-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
              Ready to Get Started?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              Join thousands of satisfied customers using Convocore to power seamless AI-driven conversations.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-transparent px-8 py-3 text-sm font-medium text-zinc-900 dark:text-white transition hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
              >
                Learn More
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="inline-flex items-center justify-center rounded-full bg-black dark:bg-white px-8 py-3 text-sm font-medium text-white dark:text-black shadow-lg transition hover:scale-105 hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </section>
      </BackgroundPaths>
    </>
  );
}
