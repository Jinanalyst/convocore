"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Share2, 
  Settings, 
  User, 
  LogOut, 
  CreditCard, 
  Wallet,
  Download,
  Link,
  Moon,
  Sun,
  Bell,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileModal } from "@/components/modals/profile-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { BillingModal } from "@/components/modals/billing-modal";
import { notificationService } from "@/lib/notification-service";
import NextLink from "next/link";

interface HeaderProps {
  className?: string;
  onShare?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  currentChatTitle?: string;
  currentChatId?: string;
}

export function Header({ 
  className, 
  onShare, 
  onSettings, 
  onProfile, 
  onLogout,
  currentChatTitle,
  currentChatId
}: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: 'Loading...',
    subscriptionTier: 'free' as 'free' | 'pro' | 'premium',
    connectionStatus: 'Connecting...'
  });

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would update the theme context/localStorage
    document.documentElement.classList.toggle('dark');
  };

  const handleShareOption = (type: 'link' | 'export') => {
    setShowShareMenu(false);
    if (type === 'link') {
      // Open share modal
      setShowShareModal(true);
    } else {
      // Open share modal with export tab
      setShowShareModal(true);
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    onProfile?.();
  };

  // Load user information on component mount
  useEffect(() => {
    loadUserInfo();

    // Subscribe to notifications (client-side only)
    if (typeof window !== 'undefined') {
      const unsubscribe = notificationService.subscribe((state) => {
        setUnreadCount(state.unreadCount);
      });

      return unsubscribe;
    }
  }, []);

  const loadUserInfo = async () => {
    try {
      // Check if wallet is connected first
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const walletAddress = localStorage.getItem('wallet_address') || '';
      const walletType = localStorage.getItem('wallet_type') || '';

      if (walletConnected) {
        // For wallet users
        setUserInfo({
          name: 'Wallet User',
          email: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
          subscriptionTier: 'free',
          connectionStatus: 'Connected'
        });
        return;
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setUserInfo({
          name: 'Demo User',
          email: 'demo@convocore.ai',
          subscriptionTier: 'pro',
          connectionStatus: 'Demo Mode'
        });
        return;
      }

      // For Supabase users
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setUserInfo({
          name: 'Guest User',
          email: 'guest@convocore.ai',
          subscriptionTier: 'free',
          connectionStatus: 'Not Connected'
        });
        return;
      }

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, subscription_tier')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Use auth user data as fallback
        setUserInfo({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || 'user@convocore.ai',
          subscriptionTier: 'free',
          connectionStatus: 'Connected'
        });
      } else {
        setUserInfo({
          name: profile.full_name || user.email?.split('@')[0] || 'User',
          email: profile.email || user.email || 'user@convocore.ai',
          subscriptionTier: profile.subscription_tier || 'free',
          connectionStatus: 'Connected'
        });
      }

    } catch (error) {
      console.error('Error loading user info:', error);
      setUserInfo({
        name: 'Demo User',
        email: 'demo@convocore.ai',
        subscriptionTier: 'pro',
        connectionStatus: 'Demo Mode'
      });
    }
  };

  return (
    <header className={cn(
      "flex items-center justify-between px-6 py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800",
      className
    )}>
      {/* Chat Title */}
      <div className="flex-1">
        {currentChatTitle && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
            {currentChatTitle}
          </h1>
        )}
      </div>

      {/* Center - Upgrade Button */}
      <div className="flex-1 flex justify-center">
        {(userInfo.subscriptionTier === 'free' || userInfo.connectionStatus === 'Demo Mode') && (
          <NextLink href="/pricing">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <ArrowUp className="w-4 h-4" />
              Upgrade Available
            </Button>
          </NextLink>
        )}
      </div>

      {/* Right Side - Action Buttons */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {/* Share Button */}
        <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleShareOption('link')}>
              <Link className="w-4 h-4 mr-2" />
              Copy share link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareOption('export')}>
              <Download className="w-4 h-4 mr-2" />
              Export chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowNotificationsModal(true)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Settings Button */}
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="w-4 h-4" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
              <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userInfo.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                  {userInfo.subscriptionTier === 'premium' ? 'Premium Plan' : 
                   userInfo.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  userInfo.connectionStatus === 'Connected' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : userInfo.connectionStatus === 'Demo Mode'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {userInfo.connectionStatus}
                </div>
              </div>
            </div>
            
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="w-4 h-4 mr-2" />
              Profile & Account
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowBillingModal(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Billing & Usage
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Wallet className="w-4 h-4 mr-2" />
              TRON Wallet
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleThemeToggle}>
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={onLogout}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <ProfileModal 
        open={showProfileModal} 
        onOpenChange={setShowProfileModal} 
      />
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        chatId={currentChatId}
        chatTitle={currentChatTitle}
      />
      <NotificationsModal
        open={showNotificationsModal}
        onOpenChange={setShowNotificationsModal}
      />
      <BillingModal
        open={showBillingModal}
        onOpenChange={setShowBillingModal}
      />
    </header>
  );
} 