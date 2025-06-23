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
  const [showShareModal, setShowShareModal] = useState(false);
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
      "flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 mt-6 sm:mt-6 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 safe-area-top",
      className
    )}>
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
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
            {isMobile ? t('subscription.upgrade') : t('header.upgradeToPro')}
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
              text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white
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
            text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white
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
                text-gray-900 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback
                border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600
                bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm
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
              onClick={() => setShowBillingModal(true)}
              className={`
                flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800
                cursor-pointer touch-feedback
                ${isMobile ? 'min-h-[48px]' : ''}
              `}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing & Plans</span>
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
              onClick={handleLogout}
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