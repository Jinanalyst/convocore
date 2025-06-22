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