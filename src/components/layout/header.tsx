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
import { shareService } from "@/lib/share-service";
import { ProfileModal } from "@/components/modals/profile-modal";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { BillingModal } from "@/components/modals/billing-modal";
import { notificationService } from "@/lib/notification-service";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import Link from "next/link";

interface HeaderProps {
  className?: string;
  onShare?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  showMobileMenu?: boolean;
  currentChatTitle?: string;
  currentChatId?: string;
}

export function Header({ 
  className, 
  onShare, 
  onSettings, 
  onProfile, 
  onLogout,
  onToggleSidebar,
  showMobileMenu = false,
  currentChatTitle,
  currentChatId
}: HeaderProps) {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would update the theme context/localStorage
    document.documentElement.classList.toggle('dark');
  };

  const handleShareOption = (type: 'link' | 'export') => {
    setShowShareMenu(false);
    if (type === 'link') {
      // Call parent share handler
      onShare?.();
    } else {
      // Call parent share handler with export preference
      onShare?.();
    }
  };

  const handleNativeShare = async () => {
    // Check if we have a chat to share
    if (!currentChatId || !currentChatTitle) {
      console.log('No chat to share');
      return;
    }

    try {
      const success = await shareService.shareChat(currentChatId, currentChatTitle);
      
      // If sharing failed and we should show the modal as fallback
      if (!success) {
        console.log('Native share failed, opening modal fallback');
        onShare?.();
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to modal
      onShare?.();
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    onProfile?.();
  };

  const handleLogout = async () => {
    await signOut();
    onLogout?.();
  };

  // Subscribe to notifications on component mount
  useEffect(() => {
    // Subscribe to notifications (client-side only)
    if (typeof window !== 'undefined') {
      const unsubscribe = notificationService.subscribe((state) => {
        setUnreadCount(state.unreadCount);
      });

      return unsubscribe;
    }
  }, []);

  return (
    <header className={cn(
      "flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800",
      className
    )}>
      {/* Mobile Layout */}
      <div className="flex items-center justify-between w-full md:hidden">
        {/* Left: Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0 touch-feedback h-10 w-10"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Center: Chat Title + Upgrade Button */}
        <div className="flex-1 flex items-center justify-center gap-3 px-2">
          {currentChatTitle && (
            <h1 className="font-semibold text-gray-900 dark:text-white truncate text-sm max-w-[120px]">
              {currentChatTitle}
            </h1>
          )}
          
          {/* Compact Upgrade Button for Mobile */}
          <Button
            asChild
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-medium rounded-full text-xs px-3 py-1.5 h-7 shrink-0"
          >
            <Link href="/pricing">
              Upgrade
            </Link>
          </Button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Share Button - Always show on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNativeShare}
            className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback h-10 w-10"
            aria-label="Share chat"
            disabled={!currentChatId}
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback h-10 w-10"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-900 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback border border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 h-10 w-10"
                aria-label="User menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
              <DropdownMenuItem 
                onClick={handleProfileClick}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer touch-feedback"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setShowBillingModal(true)}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer touch-feedback"
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing & Plans</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => onSettings?.()}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer touch-feedback"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-zinc-700" />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer touch-feedback"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left Section - Chat Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentChatTitle && (
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate max-w-md lg:max-w-lg xl:max-w-xl">
              {currentChatTitle}
            </h1>
          )}
        </div>

        {/* Center - Upgrade Button */}
        <div className="flex items-center justify-center shrink-0">
          <Button
            asChild
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 px-6 py-2.5 text-sm"
          >
            <Link href="/pricing">
              {t('header.upgradeToPro')}
            </Link>
          </Button>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNativeShare}
            className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 h-9 w-9"
            aria-label="Share chat"
            disabled={!currentChatId}
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 h-9 w-9"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-900 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm h-9 w-9"
                aria-label="User menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
              <DropdownMenuItem 
                onClick={handleProfileClick}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setShowBillingModal(true)}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing & Plans</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => onSettings?.()}
                className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-zinc-700" />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal 
        open={showProfileModal} 
        onOpenChange={setShowProfileModal}
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