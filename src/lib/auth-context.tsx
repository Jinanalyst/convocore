'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  plan: 'free' | 'pro' | 'premium';
  apiKey?: string;
  twoFactorEnabled: boolean;
  walletAddress?: string;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  subscriptionExpiry?: Date;
  dailyUsage: number;
  totalUsage: number;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return mock user for demo purposes when auth context is not available
    return {
      user: {
        id: 'demo-user',
        email: 'demo@convocore.ai',
        name: 'Demo User',
        plan: 'pro' as const,
        twoFactorEnabled: false,
        subscriptionStatus: 'active' as const,
        dailyUsage: 0,
        totalUsage: 0,
        createdAt: new Date(),
      },
      loading: false,
      login: async () => true,
      logout: async () => {},
    };
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with demo user for now
    setUser({
      id: 'demo-user',
      email: 'demo@convocore.ai',
      name: 'Demo User',
      plan: 'pro',
      twoFactorEnabled: false,
      subscriptionStatus: 'active',
      dailyUsage: 0,
      totalUsage: 0,
      createdAt: new Date(),
    });
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Implement actual login logic
    return true;
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 