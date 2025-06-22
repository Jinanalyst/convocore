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
  ArrowUp,
  Menu,
  X
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
      "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800",
      className
    )}>
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="shrink-0"
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Chat Title - Hidden on mobile, responsive on larger screens */}
      <div className="hidden md:flex flex-1 min-w-0">
        {currentChatTitle && (
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate max-w-md lg:max-w-lg xl:max-w-xl">
            {currentChatTitle}
          </h1>
        )}
      </div>

      {/* Mobile Chat Title - Centered on mobile */}
      <div className="flex-1 flex justify-center md:hidden">
        {currentChatTitle && (
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
            {currentChatTitle}
          </h1>
        )}
      </div>

      {/* Center - Upgrade Button - Hidden on mobile */}
      <div className="hidden md:flex flex-1 justify-center">
        {(userInfo.subscriptionTier === 'free' || userInfo.connectionStatus === 'Demo Mode') && (
          <NextLink href="/pricing">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md px-4 py-2 text-sm font-medium rounded-full"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Upgrade to Pro</span>
              <span className="lg:hidden">Upgrade</span>
            </Button>
          </NextLink>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle - Hidden on small mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          className="hidden sm:flex shrink-0"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications - With responsive badge */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotificationsModal(true)}
          className="relative shrink-0"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] text-[10px] font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Share Button - Hidden on mobile */}
        <div className="hidden sm:block relative">
          <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleShareOption('link')}>
                <Link className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShareOption('export')}>
                <Download className="mr-2 h-4 w-4" />
                Export Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 sm:w-72">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userInfo.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  userInfo.subscriptionTier === 'premium' 
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : userInfo.subscriptionTier === 'pro'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                )}>
                  {userInfo.subscriptionTier.charAt(0).toUpperCase() + userInfo.subscriptionTier.slice(1)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {userInfo.connectionStatus}
                </span>
              </div>
            </div>
            
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowBillingModal(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            
            {/* Mobile-only items */}
            <div className="sm:hidden">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleShareOption('link')}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleThemeToggle}>
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 left-0 w-80 h-full bg-white dark:bg-zinc-900 shadow-xl border-r border-gray-200 dark:border-zinc-800">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {/* Current Chat Title */}
              {currentChatTitle && (
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Chat</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{currentChatTitle}</p>
                </div>
              )}
              
              {/* Upgrade Button for Mobile */}
              {(userInfo.subscriptionTier === 'free' || userInfo.connectionStatus === 'Demo Mode') && (
                <NextLink href="/pricing" onClick={() => setShowMobileMenu(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none hover:from-blue-700 hover:to-purple-700">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </NextLink>
              )}
              
              <div className="space-y-1 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleShareOption('link');
                    setShowMobileMenu(false);
                  }}
                >
                  <Share2 className="mr-3 h-4 w-4" />
                  Share Chat
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowNotificationsModal(true);
                    setShowMobileMenu(false);
                  }}
                >
                  <Bell className="mr-3 h-4 w-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleThemeToggle();
                    setShowMobileMenu(false);
                  }}
                >
                  {isDarkMode ? <Sun className="mr-3 h-4 w-4" /> : <Moon className="mr-3 h-4 w-4" />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onSettings?.();
                    setShowMobileMenu(false);
                  }}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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