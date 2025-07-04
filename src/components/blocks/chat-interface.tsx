"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn, formatAIResponseToParagraphs } from '@/lib/utils';
import { useIsMobile, useViewportHeight, useKeyboardOpen, useSwipeGesture } from '@/lib/mobile-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Mic, 
  Settings, 
  Menu, 
  X, 
  Edit3, 
  Trash2,
  Share,
  Copy,
  RotateCcw,
  User,
  Bot,
  Sparkles,
  Globe,
  FileText,
  Image as ImageIcon,
  Code,
  Calculator,
  Lightbulb,
  Coins
} from 'lucide-react';
import { VoiceModal } from '@/components/modals/voice-modal';
import { SettingsModal } from '@/components/modals/settings-modal';
import { ShareModal } from '@/components/modals/share-modal';
import { ModelSelector } from '@/components/ui/model-selector';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/date-utils';
import { getDefaultModelForTier } from "@/lib/ai-service";
import { usageService } from '@/lib/usage-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RewardNotification } from '@/components/ui/reward-notification';
import { RewardBalance } from '@/components/ui/reward-balance';

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string, model: string, webSearch: boolean) => void;
}

// Utility functions
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateTitle = (firstMessage: string): string => {
  const cleaned = firstMessage.replace(/[^\w\s]/gi, '').trim();
  if (cleaned.length <= 50) return cleaned;
  
  const words = cleaned.split(' ');
  let title = '';
  
  for (const word of words) {
    if ((title + ' ' + word).length <= 47) {
      title += (title ? ' ' : '') + word;
    } else {
      break;
    }
  }
  
  return title + '...';
};

// Sidebar Component with enhanced mobile support
const ChatSidebar: React.FC<{
  sessions: any[];
  currentSession: any | null;
  onSessionSelect: (session: any) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ 
  sessions, 
  currentSession, 
  onSessionSelect, 
  onNewChat, 
  onDeleteSession, 
  onRenameSession,
  isOpen,
  onClose 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const isMobile = useIsMobile();

  const handleRename = (sessionId: string, newTitle: string) => {
    if (newTitle.trim()) {
      onRenameSession(sessionId, newTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: string) => {
    if (window.confirm('Delete this conversation?')) {
      onDeleteSession(sessionId);
    }
  };

  const startEditing = (session: any) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  return (
    <AnimatePresence>
      {(isOpen || !isMobile) && (
        <>
          {/* Mobile backdrop with enhanced touch area */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden touch-none"
              onClick={onClose}
            />
          )}
          
          {/* Sidebar with improved mobile styling */}
          <motion.aside
            initial={isMobile ? { x: -320 } : { x: 0 }}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -320 } : { x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed lg:relative top-0 left-0 h-full w-80 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col z-50",
              isMobile && "shadow-xl max-w-[85vw]"
            )}
          >
            {/* Header with better mobile spacing */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-10 w-10 p-0 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
            
            {/* New Chat Button with enhanced touch target */}
            <div className="p-4">
              <Button 
                onClick={onNewChat}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium touch-manipulation"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Chat
              </Button>
            </div>
            
            {/* Chat Sessions with improved mobile interaction */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative flex items-center p-3 rounded-lg cursor-pointer transition-all touch-manipulation",
                      "min-h-[60px]", // Enhanced touch target
                      currentSession?.id === session.id
                        ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-100 dark:hover:bg-zinc-800 active:bg-gray-200 dark:active:bg-zinc-700"
                    )}
                    onClick={() => onSessionSelect(session)}
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    
                    {editingId === session.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(session.id, editTitle)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(session.id, editTitle);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditTitle('');
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white min-h-[44px] px-2 rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <span>{session.messageCount} messages</span>
                          <span>•</span>
                          <span>{getRelativeTime(session.updatedAt)}</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons with enhanced touch targets */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className="h-8 w-8 p-0 touch-manipulation"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="h-8 w-8 p-0 touch-manipulation text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// Welcome Screen Component
const WelcomeScreen: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Conversations",
      description: "Engage with advanced AI models for natural, intelligent conversations"
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Earn CONVO Tokens",
      description: "Get rewarded with CONVO tokens for every meaningful conversation"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Code Generation",
      description: "Get help with programming, debugging, and technical solutions"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Web Search",
      description: "Access real-time information from the web when needed"
    }
  ];

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a Python function to sort an array",
    "Plan a 7-day trip to Japan",
    "Help me debug this JavaScript code",
    "Summarize the latest AI trends",
    "Create a workout plan for beginners"
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          

          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            AI chat with secure USDT payments on multiple blockchains. Start a conversation to unlock intelligent assistance and earn CONVO tokens!
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Try asking me about...
          </h2>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => onNewChat()}
                className="text-sm hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            onClick={onNewChat}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start New Conversation
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

// Message Component
const MessageComponent: React.FC<{
  message: any;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  isLast: boolean;
}> = ({ message, onCopy, onRegenerate, isLast }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex gap-4 p-6",
        message.role === 'user' 
          ? "bg-transparent" 
          : "bg-gray-50 dark:bg-zinc-900/50"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
        message.role === 'user'
          ? "bg-blue-600"
          : "bg-gradient-to-br from-purple-500 to-blue-600"
      )}>
        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
            {message.role === 'assistant' 
              ? formatAIResponseToParagraphs(message.content)
              : message.content
            }
          </div>
        </div>

        {/* Message Meta */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          {message.role === 'assistant' && isLast && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          )}

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getRelativeTime(message.timestamp)}
          </span>
          
          {message.tokens && (
            <Badge variant="secondary" className="text-xs">
              {message.tokens} tokens
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Chat Interface Component
export function ChatInterface({ className, onSendMessage }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(getDefaultModelForTier('free'));
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rewardNotification, setRewardNotification] = useState<any>(null);
  const [showRewardNotification, setShowRewardNotification] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const vh = useViewportHeight();
  const isKeyboardOpen = useKeyboardOpen();

  // Detect wallet connection for user ID (same logic as ProfileModal)
  let walletAddress: string | null = null;
  if (typeof window !== 'undefined') {
    walletAddress = localStorage.getItem('wallet-public-key') || localStorage.getItem('wallet_address');
    if (!walletAddress && (window as any).solana?.isConnected) {
      walletAddress = (window as any).solana.publicKey?.toString();
    }
  }
  const userId = walletAddress || 'guest';
  const subscription = usageService.getUserSubscription(userId);

  useEffect(() => {
    setShowPaymentModal(subscription.tier === 'none');
  }, [subscription.tier]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isLoading]);

  // Swipe gesture for mobile sidebar
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    },
  } as any); // Type assertion to fix linter error

  const createNewSession = useCallback(() => {
    const newSession: any = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: selectedModel,
      messageCount: 0
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setSidebarOpen(false);
    
    // Focus input after creating new session
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [selectedModel]);

  const selectSession = useCallback((session: any) => {
    setCurrentSession(session);
    setSidebarOpen(false);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // Implement delete session logic
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [currentSession]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      // Implement rename session logic
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  }, [currentSession]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    let session = currentSession;
    
    // Create new session if none exists
    if (!session) {
      session = {
        id: generateId(),
        title: generateTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: selectedModel,
        messageCount: 0
      };
      setSessions(prev => [session!, ...prev]);
      setCurrentSession(session);
    }

    const userMessage: any = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: new Date(),
      messageCount: session.messageCount + 1,
      title: session.messages.length === 0 ? generateTitle(content) : session.title
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === session!.id ? updatedSession : s));
    setInput('');
    setIsLoading(true);

    try {
      // Call the AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedSession.messages.map((m: any) => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel,
          includeWebSearch,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: any = {
        id: generateId(),
        role: 'assistant',
        content: data.content || data.data?.content || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        tokens: data.tokens,
        model: selectedModel
      };

      // Handle reward notification if present
      if (data.reward && data.reward.success) {
        setRewardNotification(data.reward);
        setShowRewardNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowRewardNotification(false);
        }, 5000);
      }

      // Add assistant message
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
        messageCount: updatedSession.messageCount + 1
      };

      setCurrentSession(finalSession);
      setSessions(prev => prev.map(s => s.id === session!.id ? finalSession : s));

      // Call external callback if provided
      onSendMessage?.(content, selectedModel, includeWebSearch);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: any = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: new Date(),
        messageCount: updatedSession.messageCount + 1
      };

      setCurrentSession(errorSession);
      setSessions(prev => prev.map(s => s.id === session!.id ? errorSession : s));
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, selectedModel, includeWebSearch, isLoading, onSendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isMobile || e.shiftKey) {
        // On mobile or with Shift, allow new line
        return;
      } else {
        // On desktop without Shift, submit
        e.preventDefault();
        sendMessage(input);
      }
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRegenerateResponse = () => {
    if (!currentSession || currentSession.messages.length === 0) return;
    
    // Find the last user message and regenerate from there
    const messages = [...currentSession.messages];
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
    
    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = messages[lastUserMessageIndex];
      
      // Remove messages after the last user message
      const truncatedMessages = messages.slice(0, lastUserMessageIndex + 1);
      
      const updatedSession = {
        ...currentSession,
        messages: truncatedMessages,
        messageCount: truncatedMessages.length
      };
      
      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
      
      // Regenerate the response
      setTimeout(() => {
        sendMessage(lastUserMessage.content);
      }, 100);
    }
  };

  const handleVoiceSubmit = (transcript: string) => {
    setInput(transcript);
    setTimeout(() => {
      sendMessage(transcript);
    }, 100);
  };

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Reward Notification */}
      <RewardNotification
        reward={rewardNotification}
        isVisible={showRewardNotification}
        onClose={() => setShowRewardNotification(false)}
      />

      {/* Payment Required Modal */}
      <Dialog open={showPaymentModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Payment Required
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-gray-700 dark:text-gray-200 mb-4">
              You need to pay before you can use the chat. Please upgrade your plan to access AI chat features.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
              onClick={() => window.location.href = '/pricing'}
            >
              Go to Pricing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Block chat UI if unpaid */}
      {subscription.tier !== 'none' && (
        <div 
          className={cn("flex h-full bg-white dark:bg-zinc-950", className)}
          style={{ height: isMobile ? `${vh}px` : '100vh' }}
        >
          {/* Sidebar */}
          <ChatSidebar
            sessions={sessions}
            currentSession={currentSession}
            onSessionSelect={selectSession}
            onNewChat={createNewSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content with enhanced mobile layout */}
          <div className="flex-1 flex flex-col relative">
            {/* Header with improved mobile spacing */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 min-h-[60px]">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="h-10 w-10 p-0 touch-manipulation"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                
                <div className="min-w-0 flex-1">
                  <h1 className="font-semibold text-gray-900 dark:text-white truncate">
                    {currentSession?.title || 'New Chat'}
                  </h1>
                  {currentSession && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentSession.messageCount} messages • {currentSession.model}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentSession && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    className="h-10 w-10 p-0 touch-manipulation"
                  >
                    <Share className="w-5 h-5" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                  className="h-10 w-10 p-0 touch-manipulation"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </header>

            {/* Messages Area with mobile-optimized scrolling */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {!currentSession ? (
                <WelcomeScreen onNewChat={createNewSession} />
              ) : (
                <div className="space-y-0 pb-4">
                  {currentSession.messages.map((message: any, index: number) => (
                    <MessageComponent
                      key={message.id}
                      message={message}
                      onCopy={handleCopyMessage}
                      onRegenerate={
                        message.role === 'assistant' && 
                        index === currentSession.messages.length - 1 
                          ? handleRegenerateResponse 
                          : undefined
                      }
                      isLast={index === currentSession.messages.length - 1}
                    />
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-4 p-6 bg-gray-50 dark:bg-zinc-900/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area with enhanced mobile experience */}
            <div className="border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4 safe-area-bottom">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Model Selector & Options with mobile-friendly layout */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                  
                  <Button
                    type="button"
                    variant={includeWebSearch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIncludeWebSearch(!includeWebSearch)}
                    className="h-10 px-3 touch-manipulation"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Web Search</span>
                    <span className="sm:hidden">Web</span>
                  </Button>

                  {/* Reward Balance Display */}
                  <RewardBalance 
                    walletAddress={walletAddress || undefined} 
                    className="ml-auto"
                  />
                </div>

                {/* Input Row with improved mobile input */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className={cn(
                        "w-full resize-none rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none",
                        "min-h-[48px] max-h-32 overflow-y-auto text-base", // Enhanced mobile input
                        "touch-manipulation"
                      )}
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '48px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Voice Button with enhanced touch target */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceModal(true)}
                    className="h-12 w-12 p-0 touch-manipulation"
                    disabled={isLoading}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>

                  {/* Send Button with enhanced touch target */}
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white touch-manipulation"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Modals with corrected props */}
          <VoiceModal
            open={showVoiceModal}
            onOpenChange={setShowVoiceModal}
            onTranscriptComplete={handleVoiceSubmit}
          />

          <SettingsModal
            open={showSettingsModal}
            onOpenChange={setShowSettingsModal}
          />

          {currentSession && (
            <ShareModal
              open={showShareModal}
              onOpenChange={setShowShareModal}
              chatId={currentSession.id}
              chatTitle={currentSession.title}
            />
          )}
        </div>
      )}
    </div>
  );
}