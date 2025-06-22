"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, notificationService } from '@/lib/notification-service';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  onAction?: () => void;
}

function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification.autoClose) return;

    const duration = notification.duration || 5000;
    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          setIsVisible(false);
          setTimeout(() => onClose(notification.id), 300);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'chat':
        return 'border-l-blue-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const handleClick = () => {
    if (notification.action) {
      notification.action.onClick();
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className={cn(
            "relative w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden cursor-pointer group",
            "border-l-4",
            getBorderColor(),
            notification.action && "hover:shadow-xl transition-shadow"
          )}
          onClick={handleClick}
        >
          {/* Progress bar */}
          {notification.autoClose && (
            <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-zinc-700 w-full">
              <motion.div
                className={cn(
                  "h-full transition-colors",
                  notification.type === 'success' && "bg-green-500",
                  notification.type === 'error' && "bg-red-500",
                  notification.type === 'warning' && "bg-yellow-500",
                  notification.type === 'chat' && "bg-blue-500",
                  notification.type === 'info' && "bg-blue-500"
                )}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* Avatar or Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {notification.avatar ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-lg">
                    {notification.avatar}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    {getIcon()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Timestamp */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      
                      {/* Action Button */}
                      {notification.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action!.onClick();
                            handleClose();
                          }}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window === 'undefined') return;
    
    const unsubscribe = notificationService.subscribe((state) => {
      // Only show unread notifications in toast
      const unreadNotifications = state.notifications
        .filter(n => !n.read)
        .slice(0, 5); // Limit to 5 simultaneous toasts
      setNotifications(unreadNotifications);
    });

    return unsubscribe;
  }, []);

  // Don't render on server
  if (!isClient) {
    return null;
  }

  const handleClose = (id: string) => {
    notificationService.markAsRead(id);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClose={handleClose}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 