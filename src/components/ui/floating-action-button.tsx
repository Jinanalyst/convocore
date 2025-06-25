'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { 
  Maximize2, 
  Minimize2, 
  PanelLeftClose, 
  PanelLeftOpen,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  isMobile: boolean;
  isSidebarCollapsed: boolean;
  isMaximized: boolean;
  onToggleSidebar: () => void;
  onMaximizeChat: () => void;
  className?: string;
}

export function FloatingActionButton({
  isMobile,
  isSidebarCollapsed,
  isMaximized,
  onToggleSidebar,
  onMaximizeChat,
  className
}: FloatingActionButtonProps) {
  if (isMobile) return null; // Mobile already has header controls

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex flex-col gap-2",
      className
    )}>
      <AnimatePresence>
        {/* Sidebar Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </motion.div>

        {/* Maximize Chat Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={onMaximizeChat}
            className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            aria-label={isMaximized ? "Restore view" : "Maximize chat"}
          >
            {isMaximized ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface ChatFocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatFocusMode({ 
  isActive, 
  onToggle, 
  className 
}: ChatFocusModeProps) {
  return (
    <div className={cn(
      "fixed top-4 right-4 z-50",
      className
    )}>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
          >
            <span>Focus Mode</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 