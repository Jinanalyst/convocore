"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
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
  subscription_status: 'active' | 'cancelled' | 'expired';
  api_requests_used: number;
  api_requests_limit: number;
  created_at: string;
  last_login: string;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Get user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Create basic profile from auth user if doesn't exist
        const basicProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          subscription_tier: 'free',
          subscription_status: 'active',
          api_requests_used: 0,
          api_requests_limit: 10,
          created_at: user.created_at,
          last_login: new Date().toISOString()
        };
        setUserProfile(basicProfile);
        setEditForm({
          full_name: basicProfile.full_name,
          email: basicProfile.email
        });
      } else {
        setUserProfile(profile);
        setEditForm({
          full_name: profile.full_name || '',
          email: profile.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback profile for demo
      const demoProfile: UserProfile = {
        id: 'demo-user',
        email: 'john@example.com',
        full_name: 'John Doe',
        subscription_tier: 'pro',
        subscription_status: 'active',
        api_requests_used: 45,
        api_requests_limit: 1000,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      setUserProfile(demoProfile);
      setEditForm({
        full_name: demoProfile.full_name,
        email: demoProfile.email
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userProfile.id,
          email: editForm.email,
          full_name: editForm.full_name,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        email: editForm.email
      } : null);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
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
    if (!userProfile) return 0;
    return Math.round((userProfile.api_requests_used / userProfile.api_requests_limit) * 100);
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
    return null;
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
                        onClick={handleSaveProfile}
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
                        {userProfile.full_name}
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
                      {userProfile.email}
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
                  {userProfile.subscription_tier.toUpperCase()}
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
                    {userProfile.subscription_status.charAt(0).toUpperCase() + userProfile.subscription_status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">API Usage:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {userProfile.api_requests_used.toLocaleString()} / {userProfile.api_requests_limit.toLocaleString()}
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
                    {formatDate(userProfile.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Last login
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(userProfile.last_login)}
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