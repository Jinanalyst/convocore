/**
 * Mobile responsiveness utilities for Convocore
 */

import { useState, useEffect } from 'react';

// Breakpoints
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1200,
} as const;

// Hook for mobile detection
export function useIsMobile(breakpoint: number = BREAKPOINTS.tablet) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

// Hook for viewport height with mobile browser support
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      // Use dynamic viewport height for mobile browsers
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return viewportHeight;
}

// Hook for keyboard detection on mobile
export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsKeyboardOpen(false);
      return;
    }

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      // Detect if virtual keyboard is open (height reduced by more than 150px)
      const keyboardOpen = screenHeight - currentHeight > 150;
      setIsKeyboardOpen(keyboardOpen);
      
      if (keyboardOpen) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return isKeyboardOpen;
}

// Touch gesture utility for swipe detection
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
          isDragging = false;
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
          isDragging = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
}

// Utility functions
export const isClient = () => typeof window !== 'undefined';

export const isTouchDevice = () => {
  return isClient() && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

export const isMobileUserAgent = () => {
  return isClient() && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// PWA detection
export const isPWA = () => {
  return isClient() && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// Safe area utilities for notched devices
export const hasSafeArea = () => {
  return isClient() && CSS.supports('padding: env(safe-area-inset-top)');
};

// Accessibility utilities
export const prefersReducedMotion = () => {
  return isClient() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const prefersColorScheme = (): 'light' | 'dark' | null => {
  if (!isClient()) return null;
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return null;
};

// Performance utilities for mobile
export const requestIdleCallback = (callback: () => void, timeout = 5000) => {
  if (isClient() && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, { timeout });
  } else {
    return setTimeout(callback, 0);
  }
};

export const cancelIdleCallback = (id: number) => {
  if (isClient() && 'cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Responsive text utilities
export const getResponsiveTextSize = (isMobile: boolean, baseSize: string, mobileSize: string) => {
  return isMobile ? mobileSize : baseSize;
};

export const getResponsivePadding = (isMobile: boolean, basePadding: string, mobilePadding: string) => {
  return isMobile ? mobilePadding : basePadding;
};

// Focus management for mobile
export const preventZoomOnFocus = () => {
  if (!isClient()) return;
  
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    if (input instanceof HTMLElement) {
      input.style.fontSize = '16px'; // Prevent zoom on iOS
    }
  });
};

// Haptic feedback for supported devices
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!isClient() || !(navigator as any).vibrate) return;
  
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 50
  };
  
  (navigator as any).vibrate(patterns[type]);
};

// Mobile detection and utilities
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || isSmallScreen;
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width <= 480) return 'mobile';
  if (width <= 768) return 'tablet';
  return 'desktop';
};

// Wallet deep link helpers
export const getWalletDeepLink = (walletId: string, action: string = 'connect'): string | null => {
  const deepLinks: Record<string, string> = {
    tronlink: 'tronlinkoutside://pull.activity',
    metamask: 'https://metamask.app.link/dapp/',
    trust: 'trust://open_url',
    phantom: 'phantom://browse/',
    coinbase: 'https://go.cb-w.com/dapp',
    okx: 'okx://wallet/dapp/url',
  };

  return deepLinks[walletId] || null;
};

// Mobile wallet connection helpers
export const openWalletApp = (walletId: string, fallbackUrl?: string): void => {
  const deepLink = getWalletDeepLink(walletId);
  
  if (deepLink) {
    // Try to open the wallet app
    window.location.href = deepLink;
    
    // Fallback to app store after a delay if app doesn't open
    setTimeout(() => {
      if (fallbackUrl) {
        window.open(fallbackUrl, '_blank');
      }
    }, 2000);
  } else if (fallbackUrl) {
    window.open(fallbackUrl, '_blank');
  }
};

// Mobile-optimized wallet detection
export const checkMobileWalletInstalled = async (walletId: string): Promise<boolean> => {
  if (!isMobileDevice()) return false;
  
  switch (walletId) {
    case 'metamask':
      return !!(window as any).ethereum?.isMetaMask;
    case 'trust':
      return !!(window as any).ethereum?.isTrust;
    case 'coinbase':
      return !!(window as any).ethereum?.isCoinbaseWallet;
    case 'phantom':
      return !!(window as any).solana?.isPhantom;
    case 'tronlink':
      return !!(window as any).tronLink;
    default:
      return false;
  }
};

// Mobile authentication helpers
export const getMobileAuthRedirect = (provider: string): string => {
  const baseUrl = window.location.origin;
  const currentPath = window.location.pathname;
  
  // For mobile, we want to ensure proper redirect handling
  if (isMobileDevice()) {
    return `${baseUrl}/auth/callback?provider=${provider}&redirectTo=${encodeURIComponent(currentPath)}&mobile=true`;
  }
  
  return `${baseUrl}/auth/callback?provider=${provider}&redirectTo=${encodeURIComponent(currentPath)}`;
};

// Mobile-specific error handling
export const getMobileErrorMessage = (error: string, provider: string): string => {
  if (!isMobileDevice()) return error;
  
  const mobileMessages: Record<string, string> = {
    'kakao': 'For the best KakaoTalk login experience on mobile, please open this page in the KakaoTalk browser or install the KakaoTalk app.',
    'wallet_not_found': 'Wallet app not found. Please install the wallet app from your app store first.',
    'connection_failed': 'Connection failed. Please make sure you have the latest version of the wallet app installed.',
    'permission_denied': 'Permission denied. Please allow the wallet app to access this website in your wallet settings.'
  };
  
  return mobileMessages[provider] || mobileMessages[error] || error;
};

// Touch and gesture utilities for mobile wallet UI
export const addTouchSupport = (element: HTMLElement): void => {
  if (!isMobileDevice()) return;
  
  element.style.touchAction = 'manipulation';
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.webkitTapHighlightColor = 'transparent';
};

// Responsive breakpoint utilities
export const getBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < 480) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
};

// Mobile-optimized popup handling
export const openMobileOptimizedPopup = (url: string, name: string): Window | null => {
  if (!isMobileDevice()) {
    // Desktop popup
    return window.open(url, name, 'width=400,height=600,scrollbars=yes,resizable=yes');
  }
  
  // Mobile - use full window
  return window.open(url, name);
};

// Detect if running in wallet browser
export const isWalletBrowser = (): { isWallet: boolean; walletName?: string } => {
  if (typeof window === 'undefined') return { isWallet: false };
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('metamask')) {
    return { isWallet: true, walletName: 'MetaMask' };
  }
  
  if (userAgent.includes('trust')) {
    return { isWallet: true, walletName: 'Trust Wallet' };
  }
  
  if (userAgent.includes('coinbase')) {
    return { isWallet: true, walletName: 'Coinbase Wallet' };
  }
  
  if (userAgent.includes('tronlink')) {
    return { isWallet: true, walletName: 'TronLink' };
  }
  
  if ((window as any).ethereum?.isMetaMask) {
    return { isWallet: true, walletName: 'MetaMask' };
  }
  
  if ((window as any).tronLink) {
    return { isWallet: true, walletName: 'TronLink' };
  }
  
  return { isWallet: false };
};

// Mobile viewport utilities
export const setMobileViewport = (): void => {
  if (!isMobileDevice()) return;
  
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
};

// Safe area handling for mobile devices
export const getSafeAreaInsets = (): { top: number; bottom: number; left: number; right: number } => {
  if (typeof window === 'undefined' || !isMobileDevice()) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
  };
}; 