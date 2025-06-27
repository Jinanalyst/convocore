"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { usageService, type UserUsage, type Subscription } from '@/lib/usage-service';
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Crown,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'premium';
  subscription_status: 'active' | 'cancelled' | 'expired' | 'free' | 'pro' | 'premium';
  api_requests_used: number;
  api_requests_limit: number;
  created_at?: string;
  last_login: string;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadUserProfile();
    }
  }, [open]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      // Detect wallet connection
      let walletAddress = null;
      if (typeof window !== 'undefined') {
        walletAddress = localStorage.getItem('wallet-public-key') || localStorage.getItem('wallet_address');
        if (!walletAddress && (window as any).solana?.isConnected) {
          walletAddress = (window as any).solana.publicKey?.toString();
        }
      }

      if (!walletAddress) {
        setUserProfile(null);
        setUsage(null);
        setSubscription(null);
        return;
      }

      // Use wallet address as user ID
      const userUsage = usageService.getUserUsage(walletAddress);
      const userSubscription = usageService.getUserSubscription(walletAddress);

      const profile: UserProfile = {
        id: walletAddress,
        email: walletAddress + '@wallet',
        full_name: 'Wallet User',
        avatar_url: undefined,
        subscription_tier: userSubscription.tier,
        subscription_status: userSubscription.tier,
        api_requests_used: userUsage.requestsUsed,
        api_requests_limit: userUsage.requestsLimit,
        created_at: (userSubscription as any).createdAt || new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      setUserProfile(profile);
      setUsage(userUsage);
      setSubscription(userSubscription);
      setEditForm({
        full_name: profile.full_name,
        email: profile.email
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'pro':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-purple-600';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = () => {
    if (!usage) return 0;
    return Math.round((usage.requestsUsed / usage.requestsLimit) * 100);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
          <VisuallyHidden>
            <DialogTitle>Loading Profile</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile & Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No wallet connected.<br />
            Please connect your wallet to view your profile.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile & Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Full Name"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Email"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Placeholder for saving profile
                        }}
                        disabled={isSaving}
                        className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-3 py-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            full_name: userProfile.full_name,
                            email: userProfile.email
                          });
                        }}
                        className="text-sm px-3 py-1"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(userProfile.full_name || 'Wallet User')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {(userProfile.email || 'wallet@wallet')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {getSubscriptionIcon(userProfile.subscription_tier)}
                  Subscription
                </h4>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium text-white",
                  getSubscriptionColor(userProfile.subscription_tier)
                )}>
                  {(userProfile.subscription_tier || 'free').toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span className={cn(
                    "font-medium",
                    userProfile.subscription_status === 'active' 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {(userProfile.subscription_status || 'expired').charAt(0).toUpperCase() + (userProfile.subscription_status || 'expired').slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">API Usage:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(userProfile.api_requests_used || 0).toLocaleString()} / {(userProfile.api_requests_limit || 0).toLocaleString()}
                  </span>
                </div>
                
                {/* Usage Bar */}
                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all",
                      getUsagePercentage() > 80 ? "bg-red-500" : 
                      getUsagePercentage() > 60 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsagePercentage()}% used this month
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Account Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Member since
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(userProfile.created_at || '')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Last login
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(userProfile.last_login || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
            <Button 
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => {
                // Navigate to billing page
                console.log('Navigate to billing');
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // Navigate to security settings
                console.log('Navigate to security');
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 