"use client";

export interface UserUsage {
  userId: string;
  requestsUsed: number;
  requestsLimit: number;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'premium';
}

export const usageService = {
  getUserUsage(userId: string): UserUsage {
    // Use localStorage for wallet users
    const key = `usage_${userId}`;
    const usage = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (usage) {
      return JSON.parse(usage);
    }
    // Default usage for new users
    return {
      userId,
      requestsUsed: 0,
      requestsLimit: 3,
    };
  },

  incrementUsage(userId: string) {
    const usage = this.getUserUsage(userId);
    usage.requestsUsed += 1;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`usage_${userId}`, JSON.stringify(usage));
    }
  },

  getUserSubscription(userId: string): Subscription {
    // For wallet-only, default to 'free'.
    // You can extend this to check wallet NFT or on-chain status for pro/premium.
    return { tier: 'free' };
  },
}; 