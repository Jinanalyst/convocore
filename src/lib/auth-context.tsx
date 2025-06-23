'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
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

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check wallet authentication first
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const walletAddress = localStorage.getItem('wallet_address');
      const walletType = localStorage.getItem('wallet_type');

      if (walletConnected && walletAddress) {
        setUser({
          id: `wallet_${walletAddress.toLowerCase()}`,
          email: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}@wallet.local`,
          name: 'Wallet User',
          authType: 'wallet',
          walletAddress,
          walletType: walletType || undefined,
          subscriptionTier: 'free',
          isAuthenticated: true,
        });
        setLoading(false);
        return;
      }

      // Check Supabase authentication
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  supabaseUser.email?.split('@')[0] || 'User',
            authType: 'supabase',
            subscriptionTier: 'free',
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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent('/convocore')}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }
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
      setUser({
        id: `wallet_${walletAddress.toLowerCase()}`,
        email: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}@wallet.local`,
        name: 'Wallet User',
        authType: 'wallet',
        walletAddress,
        walletType,
        subscriptionTier: 'free',
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