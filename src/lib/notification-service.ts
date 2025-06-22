export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'chat';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

class NotificationService {
  private listeners: ((state: NotificationState) => void)[] = [];
  private notifications: Notification[] = [];
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkPermission();
      this.loadStoredNotifications();
    }
  }

  private async checkPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  private loadStoredNotifications() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('convocore-notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  }

  private saveNotifications() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('convocore-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifyListeners() {
    const state: NotificationState = {
      notifications: [...this.notifications],
      unreadCount: this.notifications.filter(n => !n.read).length
    };
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: NotificationState) => void) {
    this.listeners.push(listener);
    // Immediately notify with current state
    this.notifyListeners();
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Show browser notification if permission granted and page is not visible
    if (typeof window !== 'undefined' && this.permission === 'granted' && document.hidden) {
      this.showBrowserNotification(newNotification);
    }

    return newNotification.id;
  }

  private showBrowserNotification(notification: Notification) {
    if (typeof window === 'undefined') return;
    
    try {
      const browserNotification = new window.Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Specific methods for chat notifications
  notifyChatComplete(chatTitle: string, response: string, chatId?: string) {
    this.addNotification({
      type: 'chat',
      title: 'Chat Response Ready',
      message: `"${chatTitle}" - ${response.slice(0, 100)}${response.length > 100 ? '...' : ''}`,
      avatar: '🤖',
      action: chatId ? {
        label: 'View Chat',
        onClick: () => {
          window.location.href = `/chat?id=${chatId}`;
        }
      } : undefined
    });
  }

  notifyError(title: string, message: string) {
    this.addNotification({
      type: 'error',
      title,
      message,
      avatar: '❌',
      duration: 8000
    });
  }

  notifySuccess(title: string, message: string) {
    this.addNotification({
      type: 'success',
      title,
      message,
      avatar: '✅',
      duration: 4000
    });
  }

  notifyInfo(title: string, message: string) {
    this.addNotification({
      type: 'info',
      title,
      message,
      avatar: 'ℹ️',
      duration: 5000
    });
  }
}

export const notificationService = new NotificationService(); 