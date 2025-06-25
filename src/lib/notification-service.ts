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
  private settings: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkPermission();
      this.loadStoredNotifications();
      this.loadSettings();
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
    // Check if this type of notification should be shown
    if (!this.shouldShowNotification(notification.type)) {
      return null;
    }

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

    // Play notification sound if enabled
    this.playNotificationSound();

    // Show browser notification if permission granted and push notifications enabled
    if (typeof window !== 'undefined' && 
        this.permission === 'granted' && 
        this.settings?.notifications?.push && 
        document.hidden) {
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
          window.location.href = `/convocore?id=${chatId}`;
        }
      } : undefined
    });
  }

  notifySuccess(title: string, message: string) {
    this.addNotification({ type: 'success', title, message });
  }

  notifyError(title: string, message: string) {
    this.addNotification({ type: 'error', title, message, autoClose: false });
  }

  notifyWarning(title: string, message: string) {
    this.addNotification({ type: 'warning', title, message });
  }

  notifyInfo(title: string, message: string) {
    this.addNotification({ type: 'info', title, message });
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('convocore-settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private shouldShowNotification(type: string): boolean {
    if (!this.settings?.notifications) return true;
    
    // Map notification types to settings
    const typeMap: { [key: string]: string } = {
      'chat': 'chatComplete',
      'success': 'systemUpdates',
      'error': 'securityAlerts',
      'warning': 'usageAlerts',
      'info': 'systemUpdates'
    };
    
    const settingKey = typeMap[type] || 'push';
    return this.settings.notifications[settingKey] !== false;
  }

  private shouldPlaySound(): boolean {
    if (typeof window === 'undefined') return false;
    return this.settings?.audio?.soundEffects !== false;
  }

  private playNotificationSound() {
    if (this.shouldPlaySound()) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Error playing sound:", e));
      } catch (error) {
        console.error("Could not play notification sound:", error);
      }
    }
  }

  public getSettings() {
    return this.settings;
  }
  
  public updateSettings(newSettings: any) {
    this.settings = newSettings;
    if (typeof window !== 'undefined') {
      localStorage.setItem('convocore-settings', JSON.stringify(newSettings));
    }
  }
}

export const notificationService = new NotificationService();