"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  MessageSquare, 
  AlertCircle, 
  Info, 
  X,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationState, notificationService } from '@/lib/notification-service';

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'unread' | 'chat' | 'system';

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    const unsubscribe = notificationService.subscribe((state) => {
      setNotificationState(state);
    });

    return unsubscribe;
  }, [open]);

  const filteredNotifications = notificationState.notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'chat':
        return notification.type === 'chat';
      case 'system':
        return notification.type !== 'chat';
      default:
        return true;
    }
  });

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => {
      notificationService.removeNotification(id);
    });
    setSelectedIds(new Set());
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      notificationService.clearAll();
      setSelectedIds(new Set());
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {notificationState.unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {notificationState.unreadCount}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter and Actions Bar */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 pb-3">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              {[
                { id: 'all', label: 'All', count: notificationState.notifications.length },
                { id: 'unread', label: 'Unread', count: notificationState.unreadCount },
                { id: 'chat', label: 'Chat', count: notificationState.notifications.filter(n => n.type === 'chat').length },
                { id: 'system', label: 'System', count: notificationState.notifications.filter(n => n.type !== 'chat').length }
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as FilterType)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full transition-colors",
                    filter === id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  )}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete ({selectedIds.size})
                  </Button>
                </>
              )}
              
              {notificationState.unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark All Read
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Select All */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 dark:border-zinc-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Select all ({filteredNotifications.length})
              </span>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    notification.read
                      ? "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                      : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                    selectedIds.has(notification.id) && "ring-2 ring-blue-500"
                  )}
                  onClick={() => handleSelectNotification(notification.id)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 rounded border-gray-300 dark:border-zinc-600"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {notification.avatar ? (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-sm">
                        {notification.avatar}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={cn(
                          "text-sm font-medium mb-1",
                          notification.read 
                            ? "text-gray-700 dark:text-gray-300" 
                            : "text-gray-900 dark:text-white"
                        )}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {/* Action Button */}
                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                                handleMarkAsRead(notification.id);
                              }}
                              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="ml-2 p-1 text-blue-500 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Settings Link */}
          <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
            <button
              onClick={() => {
                onOpenChange(false);
                // You can trigger settings modal here if needed
              }}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Notification Settings
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 