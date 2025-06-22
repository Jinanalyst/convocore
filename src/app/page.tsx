"use client";

import { useState } from 'react';
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { WalletLoginModal } from "@/components/modals/wallet-login-modal";

export default function Home() {
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleStartChatting = () => {
    setShowWalletModal(true);
  };

  return (
    <>
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4"
        >
          <div className="text-5xl md:text-6xl font-extrabold dark:text-white text-center text-black">
            Where AI Meets Web3
          </div>
          <div className="font-extralight text-lg md:text-xl dark:text-neutral-200 py-4 max-w-[600px] text-center text-gray-600">
            Chat smarter, code faster, pay seamlessly with USDT. Experience the future of intelligent conversations with advanced AI models, blockchain payments, and powerful features.
          </div>
          <button 
            onClick={handleStartChatting}
            className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-8 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Start Chatting Now
          </button>
        </motion.div>
      </AuroraBackground>
      
      <WalletLoginModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
      />
    </>
  );
}
