"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Eye, MessageSquare, Calendar, User, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface SharedChat {
  id: string;
  title: string;
  model: string;
  created_at: string;
  messages: Message[];
  isPublic: boolean;
  allowComments: boolean;
}

export default function SharedChatPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shareId) {
      loadSharedChat();
    }
  }, [shareId]);

  const loadSharedChat = async () => {
    try {
      const response = await fetch(`/api/shared/${shareId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This shared chat was not found or may have expired.');
        } else if (response.status === 403) {
          setError('This shared chat is private or password protected.');
        } else {
          setError('Failed to load the shared chat.');
        }
        return;
      }

      const data = await response.json();
      setChat(data.chat);
    } catch (err) {
      console.error('Error loading shared chat:', err);
      setError('An error occurred while loading the chat.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <ConvocoreLogo className="justify-center mb-4" />
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            Loading shared conversation...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ConvocoreLogo className="justify-center mb-6" />
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Chat Not Available
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Go to Convocore
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <ConvocoreLogo />
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Eye className="w-4 h-4" />
                Shared Conversation
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-zinc-700 mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {chat.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatTimestamp(chat.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Bot className="w-4 h-4" />
                  {chat.model}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {chat.messages.length} messages
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {chat.isPublic && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Public
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Try Convocore
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="space-y-6">
          {chat.messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar */}
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}

              {/* Message Content */}
              <div className={`max-w-2xl ${message.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
                
                <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTimestamp(message.created_at)}
                </div>
              </div>

              {/* User Avatar */}
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center order-2">
                  <User className="w-4 h-4 text-white dark:text-gray-900" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-700 text-center"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This conversation was shared from Convocore
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Start Your Own Conversation
          </Button>
        </motion.div>
      </main>
    </div>
  );
} 