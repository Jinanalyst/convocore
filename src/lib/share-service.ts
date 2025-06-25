export interface ShareData {
  title: string;
  text: string;
  url: string;
  chatId?: string;
  chatTitle?: string;
}

export interface ShareOptions {
  showFallbackModal?: boolean;
  copyToClipboard?: boolean;
  showNotification?: boolean;
  platform?: 'auto' | 'native' | 'modal' | 'clipboard';
}

class ShareService {
  private isWebShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           'share' in navigator && 
           'canShare' in navigator;
  }

  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
           window.innerWidth <= 768;
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.share-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: ${type === 'success' ? '#059669' : '#dc2626'}; 
        color: white; 
        padding: 12px 16px; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        font-family: system-ui;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
      ">
        <span style="font-size: 16px;">${type === 'success' ? '✅' : '❌'}</span>
        ${message}
      </div>
    `;

    // Add CSS animation
    if (!document.querySelector('#share-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'share-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds with animation
    setTimeout(() => {
      const notificationElement = notification.querySelector('div') as HTMLElement;
      if (notificationElement) {
        notificationElement.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  public async shareChat(
    chatId: string, 
    chatTitle: string, 
    options: ShareOptions = {}
  ): Promise<boolean> {
    const {
      showFallbackModal = true,
      copyToClipboard = true,
      showNotification = true,
      platform = 'auto'
    } = options;

    // Generate share URL (you can customize this)
    const shareUrl = `https://convocore.site/shared/${chatId}`;
    
    const shareData: ShareData = {
      title: `AI Chat: ${chatTitle}`,
      text: `Check out this AI conversation about "${chatTitle}" on ConvoCore`,
      url: shareUrl,
      chatId,
      chatTitle
    };

    try {
      // Platform-specific sharing
      if (platform === 'clipboard') {
        return await this.shareViaClipboard(shareData, showNotification);
      }

      if (platform === 'modal') {
        // Trigger modal (this would need to be handled by the calling component)
        return false; // Indicates modal should be shown
      }

      // Auto platform detection
      const isMobile = this.isMobileDevice();
      const hasWebShare = this.isWebShareSupported();

      if (platform === 'auto' || platform === 'native') {
        // Try native share first on mobile devices
        if (isMobile && hasWebShare && navigator.canShare(shareData)) {
          console.log('🚀 Using native Web Share API');
          await navigator.share(shareData);
          console.log('✅ Native share completed');
          return true;
        }
      }

      // Fallback to clipboard for desktop or when native share fails
      if (copyToClipboard) {
        return await this.shareViaClipboard(shareData, showNotification);
      }

      // Final fallback - return false to trigger modal
      return false;

    } catch (error) {
      console.error('Share failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share
        console.log('User cancelled share');
        return true;
      }

      // Try clipboard as final fallback
      if (copyToClipboard) {
        if (showNotification) {
          this.showNotification('Share failed, but link copied to clipboard', 'error');
        }
        return await this.shareViaClipboard(shareData, false);
      }

      if (showNotification) {
        this.showNotification('Failed to share content', 'error');
      }
      return false;
    }
  }

  private async shareViaClipboard(shareData: ShareData, showNotification: boolean): Promise<boolean> {
    const success = await this.copyToClipboard(shareData.url);
    
    if (success && showNotification) {
      this.showNotification('Share link copied to clipboard! 📋');
    } else if (!success && showNotification) {
      this.showNotification('Failed to copy link to clipboard', 'error');
    }

    return success;
  }

  public async shareUrl(url: string, title?: string, text?: string): Promise<boolean> {
    const shareData = {
      title: title || 'ConvoCore - AI Chat',
      text: text || 'Check out ConvoCore for AI conversations',
      url: url
    };

    try {
      if (this.isWebShareSupported() && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        return await this.copyToClipboard(url);
      }
    } catch (error) {
      console.error('Share URL failed:', error);
      return false;
    }
  }

  public getShareableUrl(chatId: string): string {
    return `https://convocore.site/shared/${chatId}`;
  }
}

export const shareService = new ShareService(); 