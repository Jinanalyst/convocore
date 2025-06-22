"use client";

import { useState } from "react";
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
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileModal } from "@/components/modals/profile-modal";
import { ShareModal } from "@/components/modals/share-modal";

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

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
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
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">john@example.com</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                  Pro Plan
                </div>
                <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Connected
                </div>
              </div>
            </div>
            
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="w-4 h-4 mr-2" />
              Profile & Account
            </DropdownMenuItem>
            
            <DropdownMenuItem>
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
    </header>
  );
} 