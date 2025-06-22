"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Clock, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryStatusProps {
  className?: string;
}

interface UserRecognition {
  isReturningUser: boolean;
  lastSeen: string | null;
  messageCount: number;
  preferredTopics: string[];
}

export function MemoryStatus({ className }: MemoryStatusProps) {
  const [recognition, setRecognition] = useState<UserRecognition | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadMemoryStatus();
  }, []);

  const loadMemoryStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memory?action=recognition');
      if (response.ok) {
        const data = await response.json();
        setRecognition(data.recognition);
      }
    } catch (error) {
      console.error('Failed to load memory status:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = async () => {
    try {
      setClearing(true);
      const response = await fetch('/api/memory', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setRecognition({
          isReturningUser: false,
          lastSeen: null,
          messageCount: 0,
          preferredTopics: []
        });
        
        // Show notification if available
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            title: 'Memory Cleared',
            message: 'Your conversation history has been cleared.',
            type: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Failed to clear memory:', error);
    } finally {
      setClearing(false);
    }
  };

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className={cn("bg-gray-50 dark:bg-zinc-800 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Loading memory status...</span>
        </div>
      </div>
    );
  }

  if (!recognition) {
    return (
      <div className={cn("bg-gray-50 dark:bg-zinc-800 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Memory not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {recognition.isReturningUser ? 'Welcome Back!' : 'New Conversation'}
              </h3>
              {recognition.isReturningUser && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Returning User
                </span>
              )}
            </div>
            
            {recognition.isReturningUser && (
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>{recognition.messageCount} messages exchanged</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Last seen: {formatLastSeen(recognition.lastSeen)}</span>
                </div>
                
                {recognition.preferredTopics.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Topics discussed:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recognition.preferredTopics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!recognition.isReturningUser && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                I'll remember our conversation to provide better assistance in future chats.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMemoryStatus}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          </Button>
          
          {recognition.isReturningUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMemory}
              disabled={clearing}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 