"use client";

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS standalone mode
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        return;
      }
      
      // Check if already dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; // Don't show for 7 days after dismissal
        }
      }
      
      setShowPrompt(true);
    };

    // Detect device type
    const checkDevice = () => {
      const userAgent = window.navigator.userAgent;
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    };

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      checkIfInstalled();
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    checkDevice();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show prompt after a delay if conditions are met
    const timer = setTimeout(() => {
      checkIfInstalled();
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Tap <span className="inline-block w-4 h-4 mx-1">📤</span> then "Add to Home Screen"
        </div>
      );
    }
    
    if (!isMobile) {
      return (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Look for the install icon in your address bar or click below
        </div>
      );
    }
    
    return null;
  };

  // Don't show if already installed or conditions not met
  if (isInstalled || !showPrompt) return null;

  // iOS Safari users - show manual instructions
  if (isIOS && !deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Install Convocore App
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Tap <span className="inline-block">📤</span> then "Add to Home Screen" for faster access
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard PWA install prompt
  return (
    <div className={`fixed z-50 ${
      isMobile 
        ? 'bottom-4 left-4 right-4 max-w-sm mx-auto' 
        : 'top-4 right-4 max-w-sm'
    }`}>
      <div className="bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            {isMobile ? (
              <Smartphone className="w-5 h-5 text-white" />
            ) : (
              <Monitor className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Install Convocore App
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {isMobile 
                ? "Get faster access and offline features" 
                : "Quick access from your desktop"
              }
            </div>
            {getInstallInstructions()}
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
          <button 
            onClick={handleDismiss}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Later
          </button>
          {/* Android App Button */}
          {isMobile && navigator.userAgent.toLowerCase().includes('android') && (
            <a
              href="https://play.google.com/store/apps/details?id=com.convocore.app"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
              style={{ textAlign: 'center' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              Get Android App
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 