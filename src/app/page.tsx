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
        <h1>Convocore - AI Meets Web3</h1>
        <p>
          AI chat with secure USDT payments on TRON blockchain.
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
          className="relative flex flex-col gap-4 items-center justify-center px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold dark:text-white text-center max-w-4xl mx-auto leading-tight">
            Where AI Meets Web3
          </div>
          
          <div className="font-extralight text-sm sm:text-base md:text-xl lg:text-2xl dark:text-neutral-200 py-4 max-w-3xl mx-auto leading-relaxed">
            AI chat with secure USDT payments on TRON blockchain.
          </div>
          
          <button 
            onClick={handleStartChatting}
            className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Chatting Now
          </button>
        </motion.div>
      </AuroraBackground>
    </>
  );
}
