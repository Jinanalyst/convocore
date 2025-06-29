"use client";

import { useState } from 'react';
import { Hero } from "@/components/ui/hero"
import { WalletLoginModal } from "@/components/modals/wallet-login-modal";

function HeroDemo() {
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleStartChatting = () => {
    setShowWalletModal(true);
  };

  return (
    <>
      <Hero
        title="Private AI Chat. Powered by ConvoAI Token."
        subtitle="Launch private AI conversations in seconds and pay seamlessly with ConvoAI Token across top blockchains."
        actions={[
          {
            label: "Start Chatting Now",
            onClick: handleStartChatting,
            variant: "default"
          }
        ]}
        titleClassName="text-5xl md:text-6xl font-extrabold"
        subtitleClassName="text-lg md:text-xl max-w-[600px]"
        actionsClassName="mt-8"
      />
      
      <WalletLoginModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
      />
    </>
  );
}

export { HeroDemo } 