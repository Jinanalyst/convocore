'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { usageService } from './usage-service';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  authType: 'supabase' | 'wallet' | 'demo';
  walletAddress?: string;
  walletType?: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithWallet: (walletAddress: string, walletType: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check for existing authentication on mount and listen for auth changes
  useEffect(() => {
    checkAuth();

    // Listen for auth state changes (like successful OAuth)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('Auth state changed: SIGNED_IN');
          checkAuth().then(() => {
            // Check if we need to redirect after successful auth
            const redirectTo = localStorage.getItem('auth_redirect_to');
            if (redirectTo) {
              localStorage.removeItem('auth_redirect_to');
              window.location.href = redirectTo;
            }
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('Auth state changed: SIGNED_OUT');
          checkAuth();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    
    // Run migration to fix old free plan limits
    try {
      usageService.migrateFreeUserLimits();
    } catch (error) {
      console.error('Migration error:', error);
    }
    
    try {
      // Check wallet authentication first
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const walletAddress = localStorage.getItem('wallet_address');
      const walletType = localStorage.getItem('wallet_type');

      if (walletConnected && walletAddress) {
        const userId = `wallet_${walletAddress.toLowerCase()}`;
        const subscription = usageService.getUserSubscription(userId);
        
        setUser({
          id: userId,
          email: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}@wallet.local`,
          name: 'Wallet User',
          authType: 'wallet',
          walletAddress,
          walletType: walletType || undefined,
          subscriptionTier: subscription.tier,
          isAuthenticated: true,
        });
        setLoading(false);
        return;
      }

      // Check Supabase authentication
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          const subscription = usageService.getUserSubscription(supabaseUser.id);
          
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 'User',
            authType: 'supabase',
            subscriptionTier: subscription.tier,
            isAuthenticated: true,
          });
          setLoading(false);
          return;
        }
      }

      // Fallback to demo mode
      setUser({
        id: 'demo-user',
        email: 'demo@convocore.ai',
        name: 'Demo User',
        authType: 'demo',
        subscriptionTier: 'pro',
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      // Set demo user on error
      setUser({
        id: 'demo-user',
        email: 'demo@convocore.ai',
        name: 'Demo User',
        authType: 'demo',
        subscriptionTier: 'pro',
        isAuthenticated: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Google authentication is not configured');
    }

    // Store the intended redirect location
    const redirectTo = '/convocore';
    localStorage.setItem('auth_redirect_to', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      localStorage.removeItem('auth_redirect_to');
      throw error;
    }
  };

  const signInWithKakao = async () => {
    // KakaoTalk authentication is currently in "Coming Soon" mode
    throw new Error('KakaoTalk login is coming soon! We\'re currently setting up this feature. Please use Google login or wallet connection instead.');
  };

  const signInWithWallet = async (walletAddress: string, walletType: string) => {
    try {
      // Store wallet info
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', walletAddress);
      localStorage.setItem('wallet_type', walletType);

      // Set cookies for middleware
      document.cookie = `wallet_connected=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      document.cookie = `wallet_address=${walletAddress}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `wallet_type=${walletType}; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Update user state
      const userId = `wallet_${walletAddress.toLowerCase()}`;
      const subscription = usageService.getUserSubscription(userId);
      
      setUser({
        id: userId,
        email: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}@wallet.local`,
        name: 'Wallet User',
        authType: 'wallet',
        walletAddress,
        walletType,
        subscriptionTier: subscription.tier,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Wallet authentication failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase if applicable
      if (user?.authType === 'supabase') {
        await supabase.auth.signOut();
      }

      // Clear wallet data
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_type');

      // Clear cookies
      document.cookie = 'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'wallet_address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'wallet_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Reset to demo user
      setUser({
        id: 'demo-user',
        email: 'demo@convocore.ai',
        name: 'Demo User',
        authType: 'demo',
        subscriptionTier: 'pro',
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithKakao,
    signInWithWallet,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 