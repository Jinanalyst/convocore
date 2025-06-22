// Safe date formatting utilities

/**
 * Safely format a timestamp to a Date object
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Valid Date object or current date if invalid
 */
export function safeDate(timestamp: Date | string | number | undefined): Date {
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  }
  
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Format timestamp for chat messages (time only)
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Formatted time string
 */
export function formatChatTimestamp(timestamp: Date | string | number | undefined): string {
  const date = safeDate(timestamp);
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting chat timestamp:', error);
    return 'Invalid time';
  }
}

/**
 * Format timestamp for sidebar (relative time)
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Formatted relative time string
 */
export function formatSidebarTimestamp(timestamp: Date | string | number | undefined): string {
  const date = safeDate(timestamp);
  const now = new Date();
  
  try {
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.error('Error formatting sidebar timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Format timestamp for notifications
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Formatted notification time string
 */
export function formatNotificationTimestamp(timestamp: Date | string | number | undefined): string {
  const date = safeDate(timestamp);
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting notification timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Format timestamp for full date and time
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Formatted full timestamp string
 */
export function formatFullTimestamp(timestamp: Date | string | number | undefined): string {
  const date = safeDate(timestamp);
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting full timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Get relative time description (e.g., "2 hours ago")
 * @param timestamp - Can be Date, string, number, or undefined
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: Date | string | number | undefined): string {
  const date = safeDate(timestamp);
  const now = new Date();
  
  try {
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatFullTimestamp(date);
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Some time ago';
  }
} 