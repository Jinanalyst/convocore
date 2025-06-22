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
  Link as LinkIcon,
  Moon,
  Sun,
  Bell,
  ArrowUp,
  Menu,
  X,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/mobile-utils";
import { ProfileModal } from "@/components/modals/profile-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { BillingModal } from "@/components/modals/billing-modal";
import { notificationService } from "@/lib/notification-service";
import Link from "next/link";

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
  const isMobile = useIsMobile();
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
      "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 safe-area-top",
      className
    )}>
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="shrink-0 touch-feedback min-h-[44px] min-w-[44px]"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
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

      {/* Center Navigation - Upgrade Button - Enhanced for Mobile */}
      <div className="flex items-center justify-center">
        <Button
          asChild
          className={`
            bg-black dark:bg-white text-white dark:text-black 
            hover:bg-gray-800 dark:hover:bg-gray-200 
            font-medium rounded-full shadow-lg hover:shadow-xl
            transition-all duration-200 hover:scale-105 active:scale-95
            touch-feedback
            ${isMobile 
              ? 'px-4 py-2 text-sm min-h-[44px]' 
              : 'px-6 py-2.5 text-sm'
            }
          `}
        >
          <Link href="/pricing">
            {isMobile ? "Upgrade" : "Upgrade to Pro"}
          </Link>
        </Button>
      </div>

      {/* Right Actions - Enhanced for Mobile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Share Button */}
        {currentChatId && onShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className={`
              text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
              hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback
              ${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-9 w-9'}
            `}
            aria-label="Share chat"
          >
            <Share2 className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
        )}

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className={`
            text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
            hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback
            ${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-9 w-9'}
          `}
          aria-label="Settings"
        >
          <Settings className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
        </Button>

        {/* Profile/Menu Dropdown - Enhanced for Mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`
                text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback
                ${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-9 w-9'}
              `}
              aria-label="User menu"
            >
              <User className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className={`
              w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800
              ${isMobile ? 'text-base' : 'text-sm'}
            `}
          >
            <DropdownMenuItem 
              onClick={handleProfileClick}
              className={`
                flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800
                cursor-pointer touch-feedback
                ${isMobile ? 'min-h-[48px]' : ''}
              `}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => onSettings?.()}
              className={`
                flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800
                cursor-pointer touch-feedback
                ${isMobile ? 'min-h-[48px]' : ''}
              `}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-zinc-700" />
            
            <DropdownMenuItem 
              onClick={() => onLogout?.()}
              className={`
                flex items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-900/20
                text-red-600 dark:text-red-400 cursor-pointer touch-feedback
                ${isMobile ? 'min-h-[48px]' : ''}
              `}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enhanced Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setShowMobileMenu(false)} 
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 w-80 h-full bg-white dark:bg-zinc-900 shadow-xl border-r border-gray-200 dark:border-zinc-800 safe-area-top">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  className="touch-feedback min-h-[44px] min-w-[44px]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Current Chat Title */}
            {currentChatTitle && (
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Chat</div>
                <div className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {currentChatTitle}
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="flex flex-col p-4 space-y-2">
              {/* Chat Actions */}
              {currentChatId && onShare && (
                <button
                  onClick={() => {
                    onShare?.();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors touch-feedback min-h-[48px]"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share Chat</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleProfileClick();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors touch-feedback min-h-[48px]"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  onSettings?.();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors touch-feedback min-h-[48px]"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>

              {/* Upgrade Button for Mobile */}
              <Link
                href="/pricing"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 p-3 text-left bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors touch-feedback min-h-[48px] font-medium"
              >
                <Zap className="h-5 w-5" />
                <span>Upgrade to Pro</span>
              </Link>

              {/* Sign Out */}
              <button
                onClick={() => {
                  onLogout?.();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 p-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-feedback min-h-[48px] mt-4"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-zinc-800 safe-area-bottom">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Convocore v1.0 • AI Meets Web3
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