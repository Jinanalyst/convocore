"use client";

import type { Metadata } from "next";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useState, useEffect } from 'react';

// Note: Since this is a client component, metadata should be in layout.tsx
// This is just for reference - the actual metadata is in layout.tsx

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartChatting = () => {
    router.push('/auth/login');
  };

  return (
    <>
      {/* Hidden SEO content for search engines */}
      <div className="sr-only">
        <h1>Convocore - AI Meets Web3</h1>
        <p>
          AI chat with secure USDT payments on multiple blockchains.
        </p>
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
          className="relative flex flex-col gap-4 sm:gap-6 items-center justify-center px-4 sm:px-6 lg:px-8 text-center min-h-screen safe-area-top safe-area-bottom"
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

          {/* PWA Install Prompt for Mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="fixed bottom-4 left-4 right-4 z-50 pwa-install-prompt"
            >
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Install Convocore App
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Get faster access and offline features
                    </div>
                  </div>
                  <button 
                    className="text-blue-500 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => {
                      // PWA install logic would go here
                      document.querySelector('.pwa-install-prompt')?.classList.add('hidden');
                    }}
                  >
                    Install
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AuroraBackground>
    </>
  );
}
