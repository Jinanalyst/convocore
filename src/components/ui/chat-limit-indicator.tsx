'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usageService, type UserUsage } from '@/lib/usage-service';
import { cn } from '@/lib/utils';

interface ChatLimitIndicatorProps {
  className?: string;
  usage: {
    used: number;
    limit: number;
    plan: 'free' | 'pro' | 'premium';
  };
}

export function ChatLimitIndicator({
  className,
  usage,
}: ChatLimitIndicatorProps) {
  // Don't show indicator for unlimited plans
  if (usage.plan !== 'free' || usage.limit === -1) {
    return null;
  }

  const remaining = Math.max(0, usage.limit - usage.used);
  const isLimitReached = remaining === 0;
  const isNearLimit = remaining === 1;

  return (
    <div className={cn('w-full', className, 'text-lg p-4 md:text-base md:p-2')}>
      <div
        className={cn(
          'flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-200',
          isLimitReached
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            : isNearLimit
            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
        )}
      >
        {/* Left Side - Usage Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center',
              isLimitReached
                ? 'bg-red-100 dark:bg-red-900/30'
                : isNearLimit
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            )}
          >
            <AlertCircle
              className={cn(
                'w-3 h-3 sm:w-4 sm:h-4',
                isLimitReached
                  ? 'text-red-600 dark:text-red-400'
                  : isNearLimit
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {isLimitReached ? (
                <span className="font-medium text-red-600 dark:text-red-400">
                  No chats remaining today
                </span>
              ) : (
                <span>
                  <span className="font-medium">{remaining}</span>{' '}
                  <span className="hidden sm:inline">
                    {' '}
                    chat
                    {remaining !== 1 ? 's' : ''} remaining
                  </span>
                  <span className="sm:hidden"> left</span>
                  <span className="text-gray-400 dark:text-gray-500 ml-1">
                    ({usage.used}/{usage.limit})
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Upgrade Button */}
        <div className="flex-shrink-0 ml-2 sm:ml-4">
          <Button
            size="sm"
            className={cn(
              'h-12 sm:h-9 px-4 text-lg sm:text-sm font-medium transition-all duration-200',
              isLimitReached
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
                : 'bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black'
            )}
            onClick={() => {
              // Navigate to pricing page
              window.location.href = '/pricing';
            }}
          >
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {isLimitReached ? 'Upgrade Now' : 'Upgrade'}
            </span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {usage.limit > 0 && (
        <div className="mt-2 sm:mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isLimitReached
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              )}
              style={{
                width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>0</span>
            <span>{usage.limit} chats/day</span>
          </div>
        </div>
      )}
    </div>
  );
} 