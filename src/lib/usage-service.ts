"use client";

export interface UserUsage {
  userId: string;
  requestsUsed: number;
  requestsLimit: number;
}

export interface Subscription {
  tier: 'pro' | 'premium' | 'none';
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

  // Enforce payment before AI service usage
  getUserSubscription(userId: string): Subscription {
    // Allow admin/test Solana address to always have premium
    if (userId === 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2') {
      return { tier: 'premium' };
    }
    // Check for payment record in localStorage (or replace with API call)
    if (typeof window !== 'undefined') {
      const payment = localStorage.getItem(`payment_${userId}`);
      if (payment) {
        const parsed = JSON.parse(payment);
        if (parsed.amount === 150) return { tier: 'pro' };
        if (parsed.amount === 200) return { tier: 'premium' };
      }
    }
    return { tier: 'none' };
  },
}; 