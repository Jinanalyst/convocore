"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';

interface ContextWrapperProps {
  children: React.ReactNode;
}

export function ContextWrapper({ children }: ContextWrapperProps) {
  const [isContextReady, setIsContextReady] = useState(false);
  
  // Test if language context is available
  const languageContext = useLanguage();
  
  useEffect(() => {
    // Small delay to ensure all contexts are properly initialized
    const timer = setTimeout(() => {
      setIsContextReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isContextReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 