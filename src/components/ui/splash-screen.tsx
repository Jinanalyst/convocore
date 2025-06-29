'use client';

import { useEffect, useState } from 'react';
import { ConvoAILogo } from './convoai-logo';

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse"></div>
      
      {/* Main logo container */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo with animation */}
        <div className="relative">
          <div className="animate-bounce">
            <ConvoAILogo className="w-24 h-24 text-white drop-shadow-2xl" />
          </div>
          
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping animation-delay-200"></div>
        </div>
        
        {/* App name */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            ConvoAI
          </h1>
          <p className="text-white/80 text-lg font-medium">
            AI Conversations
          </p>
        </div>
        
        {/* Loading indicator */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
      
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>
  );
} 