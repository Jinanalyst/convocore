"use client";

export interface UserUsage {
  userId: string;
  plan: 'free' | 'pro' | 'premium';
  requestsUsed: number;
  requestsLimit: number;
  resetDate: string; // When the limit resets
  lastUpdated: string;
}

export interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
}

class UsageService {
  private readonly STORAGE_KEY = 'user_usage';
  private readonly SUBSCRIPTION_KEY = 'user_subscription';

  // Plan limits
  private readonly PLAN_LIMITS = {
    free: 3,
    pro: 1000,
    premium: 5000
  };

  // Get current usage for user
  getUserUsage(userId: string): UserUsage {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        const usage = JSON.parse(stored);
        
        // Migration: Fix old free plan limits that were set to 10 instead of 3
        if (usage.plan === 'free' && usage.requestsLimit === 10) {
          console.log('Migrating old free plan limit from 10 to 3');
          usage.requestsLimit = 3;
          // Reset usage if it exceeds new limit
          if (usage.requestsUsed > 3) {
            usage.requestsUsed = 0;
            usage.resetDate = new Date().toISOString();
          }
          this.saveUsage(userId, usage);
        }
        
        // Check if we need to reset daily limit
        if (this.shouldResetUsage(usage)) {
          return this.resetDailyUsage(userId, usage.plan);
        }
        return usage;
      }

      // Create new usage tracking for user
      const subscription = this.getUserSubscription(userId);
      return this.createInitialUsage(userId, subscription.tier);
    } catch (error) {
      console.error('Error getting user usage:', error);
      return this.createInitialUsage(userId, 'free');
    }
  }

  // Get subscription info
  getUserSubscription(userId: string): SubscriptionInfo {
    try {
      const stored = localStorage.getItem(`${this.SUBSCRIPTION_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Default free subscription
      return {
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: false
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return {
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: false
      };
    }
  }

  // Increment usage when user makes a request
  incrementUsage(userId: string): { success: boolean; usage: UserUsage; limitExceeded: boolean } {
    const usage = this.getUserUsage(userId);
    
    if (usage.requestsUsed >= usage.requestsLimit) {
      return {
        success: false,
        usage,
        limitExceeded: true
      };
    }

    const updatedUsage = {
      ...usage,
      requestsUsed: usage.requestsUsed + 1,
      lastUpdated: new Date().toISOString()
    };

    this.saveUsage(userId, updatedUsage);
    
    // Trigger events for UI updates
    this.triggerUsageUpdate();

    return {
      success: true,
      usage: updatedUsage,
      limitExceeded: false
    };
  }

  // Update subscription (when user upgrades/downgrades)
  updateSubscription(userId: string, newTier: 'free' | 'pro' | 'premium'): SubscriptionInfo {
    const currentSubscription = this.getUserSubscription(userId);
    const currentUsage = this.getUserUsage(userId);

    const updatedSubscription: SubscriptionInfo = {
      ...currentSubscription,
      tier: newTier,
      status: 'active',
      startDate: new Date().toISOString(),
      autoRenew: true
    };

    // Update usage limits
    const updatedUsage: UserUsage = {
      ...currentUsage,
      plan: newTier,
      requestsLimit: this.PLAN_LIMITS[newTier],
      lastUpdated: new Date().toISOString()
    };

    this.saveSubscription(userId, updatedSubscription);
    this.saveUsage(userId, updatedUsage);

    return updatedSubscription;
  }

  // Check if user can make a request
  canMakeRequest(userId: string): boolean {
    const usage = this.getUserUsage(userId);
    return usage.requestsUsed < usage.requestsLimit;
  }

  // Get usage percentage
  getUsagePercentage(userId: string): number {
    const usage = this.getUserUsage(userId);
    return Math.round((usage.requestsUsed / usage.requestsLimit) * 100);
  }

  // Reset usage for new period (daily for free, monthly for paid)
  private shouldResetUsage(usage: UserUsage): boolean {
    const lastReset = new Date(usage.resetDate);
    const now = new Date();

    if (usage.plan === 'free') {
      // Reset daily for free users
      const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 1;
    } else {
      // Reset monthly for paid users
      const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                        (now.getMonth() - lastReset.getMonth());
      return monthsDiff >= 1;
    }
  }

  private resetDailyUsage(userId: string, plan: 'free' | 'pro' | 'premium'): UserUsage {
    const now = new Date();
    const resetDate = plan === 'free' 
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const resetUsage: UserUsage = {
      userId,
      plan,
      requestsUsed: 0,
      requestsLimit: this.PLAN_LIMITS[plan],
      resetDate,
      lastUpdated: now.toISOString()
    };

    this.saveUsage(userId, resetUsage);
    return resetUsage;
  }

  private createInitialUsage(userId: string, plan: 'free' | 'pro' | 'premium'): UserUsage {
    const now = new Date();
    const resetDate = plan === 'free' 
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const usage: UserUsage = {
      userId,
      plan,
      requestsUsed: 0,
      requestsLimit: this.PLAN_LIMITS[plan],
      resetDate,
      lastUpdated: now.toISOString()
    };

    this.saveUsage(userId, usage);
    return usage;
  }

  private saveUsage(userId: string, usage: UserUsage): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(usage));
      
      // Trigger storage event for cross-tab communication
      this.triggerUsageUpdate();
    } catch (error) {
      console.error('Error saving usage:', error);
    }
  }

  private saveSubscription(userId: string, subscription: SubscriptionInfo): void {
    try {
      localStorage.setItem(`${this.SUBSCRIPTION_KEY}_${userId}`, JSON.stringify(subscription));
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  // Admin/debugging methods
  clearUserData(userId: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    localStorage.removeItem(`${this.SUBSCRIPTION_KEY}_${userId}`);
  }

  // Force migrate all users from old limits
  migrateFreeUserLimits(): void {
    console.log('🔄 Migrating all free user limits...');
    
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    
    // Find all user usage keys
    const usageKeys = allKeys.filter(key => key.startsWith(this.STORAGE_KEY));
    
    usageKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const usage = JSON.parse(stored);
          
          // Check if this is a free plan with old limit
          if (usage.plan === 'free' && usage.requestsLimit === 10) {
            console.log(`🔧 Migrating ${key} from 10 to 3 limit`);
            usage.requestsLimit = 3;
            
            // Reset usage if it exceeds new limit
            if (usage.requestsUsed > 3) {
              usage.requestsUsed = 0;
              usage.resetDate = new Date().toISOString();
              console.log(`🔄 Reset usage count for ${key}`);
            }
            
            localStorage.setItem(key, JSON.stringify(usage));
          }
        }
      } catch (error) {
        console.error(`Error migrating ${key}:`, error);
      }
    });
    
    console.log('✅ Migration complete');
  }

  getAllUsageData(): { [userId: string]: UserUsage } {
    const allData: { [userId: string]: UserUsage } = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          allData[data.userId] = data;
        } catch (error) {
          console.error('Error parsing usage data:', error);
        }
      }
    }
    
    return allData;
  }

  private triggerUsageUpdate(): void {
    try {
      // Set a timestamp for storage event
      localStorage.setItem('usage_updated', Date.now().toString());
      
      // Dispatch custom event for same-tab communication
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usageUpdated', {
          detail: { timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Error triggering usage update:', error);
    }
  }
}

export const usageService = new UsageService(); 