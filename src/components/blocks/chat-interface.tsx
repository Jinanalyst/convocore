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
  Lightbulb
} from 'lucide-react';
import { VoiceModal } from '@/components/modals/voice-modal';
import { SettingsModal } from '@/components/modals/settings-modal';
import { ShareModal } from '@/components/modals/share-modal';
import { ModelSelector } from '@/components/ui/model-selector';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/date-utils';

// Types
import { chatStorageService, type ChatMessage, type ChatSession } from "@/lib/chat-storage-service";

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



// Sidebar Component
const ChatSidebar: React.FC<{
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSessionSelect: (session: ChatSession) => void;
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

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  return (
    <AnimatePresence>
      {(isOpen || !isMobile) && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
          )}
          
          {/* Sidebar */}
          <motion.aside
            initial={isMobile ? { x: -320 } : { x: 0 }}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -320 } : { x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed lg:relative top-0 left-0 h-full w-80 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col z-50",
              isMobile && "shadow-xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                onClick={onNewChat}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
            
            {/* Chat Sessions */}
            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative flex items-center p-3 rounded-lg cursor-pointer transition-all",
                      currentSession?.id === session.id
                        ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                    onClick={() => onSessionSelect(session)}
                  >
                    <MessageSquare className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    
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
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span>{session.messageCount} messages</span>
                          <span>•</span>
                          <span>{getRelativeTime(session.updatedAt)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Start a new chat to begin</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Convocore AI Chat
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
      icon: <Code className="w-6 h-6" />,
      title: "Code Generation",
      description: "Get help with programming, debugging, and technical solutions"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Web Search",
      description: "Access real-time information from the web when needed"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Document Analysis",
      description: "Upload and analyze documents, images, and files"
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
          
          {/* Hide welcome title on mobile, show condensed version on desktop */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden sm:block text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Welcome to Convocore
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            AI chat with secure USDT payments on multiple blockchains. Start a conversation to unlock intelligent assistance.
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
  message: ChatMessage;
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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const vh = useViewportHeight();
  const isKeyboardOpen = useKeyboardOpen();

  // Load sessions using the chat storage service
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const loadedSessions = await chatStorageService.loadChatSessions();
        setSessions(loadedSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    loadSessions();
  }, []);

  // Save sessions using the chat storage service whenever sessions change
  useEffect(() => {
    const saveSessions = async () => {
      if (sessions.length > 0) {
        // Save each session to the storage service
        for (const session of sessions) {
          try {
            await chatStorageService.saveChatSession(session);
          } catch (error) {
            console.error('Failed to save session:', session.id, error);
          }
        }
      }
    };

    saveSessions();
  }, [sessions]);

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
  });

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
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

  const selectSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setSidebarOpen(false);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await chatStorageService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [currentSession]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      await chatStorageService.updateSessionTitle(sessionId, newTitle);
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle, updatedAt: new Date() }
          : session
      ));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title: newTitle, updatedAt: new Date() } : null);
      }
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

    const userMessage: ChatMessage = {
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
          messages: updatedSession.messages.map(m => ({
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
      
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.content || data.data?.content || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        tokens: data.tokens,
        model: selectedModel
      };

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
      
      const errorMessage: ChatMessage = {
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {currentSession?.title || 'New Chat'}
              </h1>
              {currentSession && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
              >
                <Share className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentSession ? (
            <WelcomeScreen onNewChat={createNewSession} />
          ) : (
            <div className="space-y-0">
              {currentSession.messages.map((message, index) => (
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

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Model Selector & Options */}
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
                className="h-8"
              >
                <Globe className="w-4 h-4 mr-1" />
                Web Search
              </Button>
            </div>

            {/* Input Row */}
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
                    "min-h-[44px] max-h-32 overflow-y-auto"
                  )}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '44px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                  disabled={isLoading}
                />
              </div>

              {/* Voice Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVoiceModal(true)}
                className="h-11 w-11 p-0"
                disabled={isLoading}
              >
                <Mic className="w-4 h-4" />
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <VoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSubmit={handleVoiceSubmit}
        selectedModel={selectedModel}
      />

      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />

      {currentSession && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          chatSession={currentSession}
        />
      )}
    </div>
  );
}