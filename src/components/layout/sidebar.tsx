"use client";

import { useState, useEffect, useRef } from "react";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/settings-modal";
import { SearchModal } from "@/components/modals/search-modal";
import { LibraryModal } from "@/components/modals/library-modal";
import { ModelInfoModal } from "@/components/modals/model-info-modal";
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Library, 
  Settings, 
  Trash2,
  Edit3,
  MoreHorizontal,
  Bot,
  BookOpen,
  History,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  HelpCircle,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSidebarTimestamp } from '@/lib/date-utils';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive?: boolean;
}

interface SidebarProps {
  className?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onUseLibraryItem?: (item: LibraryItem) => void;
  activeChatId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'prompt' | 'conversation' | 'template';
  description: string;
  content?: string;
  createdAt: Date;
}

interface ModelInfo {
  name: string;
  description: string;
  capabilities: string[];
  contextLength: number;
  pricing: string;
}

export function Sidebar({ 
  className, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onUseLibraryItem,
  activeChatId,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Real chat data from Supabase
  const [chats, setChats] = useState<Chat[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [favoriteChats, setFavoriteChats] = useState<Chat[]>([]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Load real data on component mount
  useEffect(() => {
    loadChats();
    loadLibraryItems();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      
      // Always show some demo chats for now (for testing)
      const demoChats: Chat[] = [
        {
          id: 'demo-1',
          title: 'Welcome to Convocore',
          lastMessage: 'Hello! How can I help you today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: 'demo-2',
          title: 'Getting Started Guide',
          lastMessage: 'Let me know what you\'d like to explore...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: 'demo-3',
          title: 'Code Generation Help',
          lastMessage: 'I can help you write and debug code...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
      ];

      // Check authentication methods
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const magicLinkAuth = document.cookie.includes('auth_method=magic_link');
      
      if (walletConnected) {
        // Load wallet-based chats
        const walletChats = JSON.parse(localStorage.getItem('wallet_chats') || '[]');
        if (walletChats.length > 0) {
          const formattedChats = walletChats.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp || Date.now())
          }));
          setChats([...formattedChats, ...demoChats]);
          setRecentChats([...formattedChats, ...demoChats].slice(0, 5));
          setIsLoading(false);
          return;
        }
      }

      if (magicLinkAuth) {
        // Load magic link chats
        const magicLinkChats = JSON.parse(localStorage.getItem('magic_link_chats') || '[]');
        if (magicLinkChats.length > 0) {
          const formattedChats = magicLinkChats.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp || Date.now())
          }));
          setChats([...formattedChats, ...demoChats]);
          setRecentChats([...formattedChats, ...demoChats].slice(0, 5));
          setIsLoading(false);
          return;
        }
      }

      // Try to load from Supabase
      try {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(50);

          if (!error && conversations && conversations.length > 0) {
            const formattedChats: Chat[] = conversations.map(conv => ({
              id: conv.id,
              title: conv.title || 'Untitled Chat',
              lastMessage: conv.summary || 'No messages yet',
              timestamp: new Date(conv.updated_at),
              isActive: conv.id === activeChatId
            }));

            setChats([...formattedChats, ...demoChats]);
            setRecentChats([...formattedChats, ...demoChats].slice(0, 5));
            setFavoriteChats(formattedChats.slice(0, 3));
            setIsLoading(false);
            return;
          }
        }
      } catch (supabaseError) {
        console.log('Supabase not available, using demo chats');
      }

      // Fallback to demo chats
      setChats(demoChats);
      setRecentChats(demoChats);
      setFavoriteChats(demoChats.slice(0, 2));
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading chats:', error);
      // Final fallback
      const fallbackChats: Chat[] = [
        {
          id: 'fallback-1',
          title: 'Welcome to Convocore',
          lastMessage: 'Hello! How can I help you today?',
          timestamp: new Date(),
        },
      ];
      setChats(fallbackChats);
      setRecentChats(fallbackChats);
      setIsLoading(false);
    }
  };

  const loadLibraryItems = async () => {
    // Load saved prompts and templates from localStorage
    const savedItems = JSON.parse(localStorage.getItem('library_items') || '[]');
    
    // Add some default items if none exist
    if (savedItems.length === 0) {
      const defaultItems: LibraryItem[] = [
        {
          id: '1',
          title: 'Code Review',
          type: 'prompt',
          description: 'Template for code review requests',
          content: 'Please review this code for best practices, security issues, and performance optimizations:\n\n[paste your code here]',
          createdAt: new Date()
        },
        {
          id: '2',
          title: 'Meeting Notes',
          type: 'template',
          description: 'Structure for meeting summaries',
          content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n**Agenda:** \n\n## Discussion Points\n\n## Action Items\n\n## Next Steps',
          createdAt: new Date()
        },
        {
          id: '3',
          title: 'Explain Like I\'m 5',
          type: 'prompt',
          description: 'Simplify complex topics',
          content: 'Please explain [topic] in simple terms that a 5-year-old could understand, using analogies and examples.',
          createdAt: new Date()
        }
      ];
      
      localStorage.setItem('library_items', JSON.stringify(defaultItems));
      setLibraryItems(defaultItems);
    } else {
      // Ensure dates are properly converted
      const formattedItems = savedItems.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
      setLibraryItems(formattedItems);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatAction = async (e: React.MouseEvent, action: 'edit' | 'delete', chatId: string) => {
    e.stopPropagation();
    
    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this chat?')) {
        try {
          const { createClientComponentClient } = await import('@/lib/supabase');
          const supabase = createClientComponentClient();
          
          const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', chatId);

          if (error) {
            console.error('Error deleting chat:', error);
            return;
          }

          // Remove from local state
          setChats(prev => prev.filter(chat => chat.id !== chatId));
          
          // Call parent callback
          onDeleteChat?.(chatId);
        } catch (error) {
          console.error('Error deleting chat:', error);
        }
      }
    } else if (action === 'edit') {
      const newTitle = prompt('Enter new chat title:');
      if (newTitle && newTitle.trim()) {
        try {
          const { createClientComponentClient } = await import('@/lib/supabase');
          const supabase = createClientComponentClient();
          
          const { error } = await supabase
            .from('conversations')
            .update({ title: newTitle.trim() })
            .eq('id', chatId);

          if (error) {
            console.error('Error updating chat title:', error);
            return;
          }

          // Update local state
          setChats(prev => prev.map(chat => 
            chat.id === chatId 
              ? { ...chat, title: newTitle.trim() }
              : chat
          ));
        } catch (error) {
          console.error('Error updating chat title:', error);
        }
      }
    }
  };

  const handleNewChat = async () => {
    try {
      // Check if wallet is connected first
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const magicLinkAuth = document.cookie.includes('auth_method=magic_link');
      
      if (walletConnected || magicLinkAuth) {
        // For wallet and magic link users, create chat locally
        const newChat: Chat = {
          id: Date.now().toString(),
          title: 'New Chat',
          lastMessage: 'No messages yet',
          timestamp: new Date(),
        };
        
        setChats(prev => [newChat, ...prev]);
        
        // Save to localStorage
        const storageKey = walletConnected ? 'wallet_chats' : 'magic_link_chats';
        const updatedChats = [newChat, ...chats];
        localStorage.setItem(storageKey, JSON.stringify(updatedChats));
        
        onNewChat?.();
        setIsMobileMenuOpen(false); // Close mobile menu
        return;
      }

      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not authenticated, cannot create chat');
        return;
      }

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New Chat',
          model: 'gpt-4o',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new chat:', error);
        return;
      }

      const newChat: Chat = {
        id: newConversation.id,
        title: newConversation.title,
        lastMessage: 'No messages yet',
        timestamp: new Date(newConversation.created_at),
      };

      setChats(prev => [newChat, ...prev]);
      onNewChat?.();
      setIsMobileMenuOpen(false); // Close mobile menu
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSearch = () => {
    setShowSearchModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  const handleLibrary = () => {
    setShowLibraryModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  const handleModelInfo = () => {
    setShowModelModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  const handleChatSelect = (chatId: string) => {
    onSelectChat?.(chatId);
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  // Mobile Menu Button (visible only on mobile)
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="mobile-menu-button lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      aria-label="Toggle menu"
    >
      {isMobileMenuOpen ? (
        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );

  // Mobile Overlay (visible only on mobile when menu is open)
  const MobileOverlay = () => (
    isMobileMenuOpen && (
      <div 
        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )
  );

  // Sidebar Content Component
  const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700",
        isCollapsed && isDesktop && "justify-center px-2"
      )}>
        {!isCollapsed || !isDesktop ? (
          <ConvocoreLogo />
        ) : (
          <ConvocoreLogo size="sm" showText={false} />
        )}
        
        {!isDesktop && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Desktop Collapse Toggle */}
        {isDesktop && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "shrink-0",
              isCollapsed && "absolute top-4 right-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className={cn("p-4", isCollapsed && isDesktop && "px-2")}>
        <Button
          onClick={handleNewChat}
          className={cn(
            "w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors",
            isCollapsed && isDesktop ? "px-0 justify-center" : "justify-start gap-2"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {(!isCollapsed || !isDesktop) && <span>New Chat</span>}
        </Button>
      </div>

      {/* Search and Library */}
      {(!isCollapsed || !isDesktop) ? (
        <div className="px-4 pb-4 space-y-2">
          <Button
            variant="ghost"
            onClick={handleSearch}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button
            variant="ghost"
            onClick={handleLibrary}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <Archive className="w-4 h-4 mr-2" />
            Library
          </Button>
        </div>
      ) : (
        <div className="px-2 pb-4 space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearch}
            className="w-full"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLibrary}
            className="w-full"
            title="Library"
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Model Info and Settings */}
      {(!isCollapsed || !isDesktop) ? (
        <div className="px-4 pb-4 space-y-2">
          <Button
            variant="ghost"
            onClick={handleModelInfo}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Models
          </Button>
          <Button
            variant="ghost"
            onClick={handleSettings}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      ) : (
        <div className="px-2 pb-4 space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleModelInfo}
            className="w-full"
            title="Model Info"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettings}
            className="w-full"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Recent Chats */}
      <div className="flex-1 overflow-hidden">
        {(!isCollapsed || !isDesktop) && (
          <div className="px-4 pb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Chats
            </h3>
          </div>
        )}
        
        {/* Chat List Container with Border */}
        <div className={cn(
          "flex-1 overflow-hidden mx-3 rounded-xl border-2 border-gray-300 dark:border-zinc-600 bg-gray-50/80 dark:bg-zinc-800/80 shadow-sm",
          isCollapsed && isDesktop && "mx-2"
        )}>
          <div className="h-full overflow-y-auto chat-container-scroll p-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "animate-pulse bg-gray-200 dark:bg-zinc-600 rounded-lg",
                      isCollapsed && isDesktop ? "h-10 w-10 mx-auto" : "h-14"
                    )} 
                  />
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              (!isCollapsed || !isDesktop) && (
                <div className="text-center py-10 px-3">
                  <MessageSquare className="w-10 h-10 text-gray-300 dark:text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No chats yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new conversation</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md",
                      chat.id === activeChatId
                        ? "bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 shadow-md"
                        : "bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500"
                    )}
                    onMouseEnter={() => setHoveredChatId(chat.id)}
                    onMouseLeave={() => setHoveredChatId(null)}
                  >
                    <button
                      onClick={() => handleChatSelect(chat.id)}
                      className={cn(
                        "w-full text-left transition-all duration-200",
                        isCollapsed && isDesktop ? "p-3 flex justify-center" : "p-4"
                      )}
                      title={isCollapsed && isDesktop ? chat.title : undefined}
                    >
                      {isCollapsed && isDesktop ? (
                        <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {chat.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {chat.lastMessage}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatSidebarTimestamp(chat.timestamp)}
                            </p>
                          </div>
                          
                          {hoveredChatId === chat.id && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={(e) => handleChatAction(e, 'edit', chat.id)}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit chat"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={(e) => handleChatAction(e, 'delete', chat.id)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-80",
        "h-full overflow-hidden",
        className
      )}>
        <SidebarContent isDesktop={true} />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "mobile-sidebar lg:hidden fixed top-0 left-0 h-full w-80 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 transform transition-transform duration-300 ease-in-out z-50",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent isDesktop={false} />
      </aside>

      {/* Modals */}
      <SearchModal 
        open={showSearchModal} 
        onOpenChange={setShowSearchModal}
        chats={chats}
        onSelectChat={handleChatSelect}
      />
      <LibraryModal 
        open={showLibraryModal} 
        onOpenChange={setShowLibraryModal}
        items={libraryItems}
        onUseItem={(item) => {
          onUseLibraryItem?.(item);
          setShowLibraryModal(false);
        }}
      />
      <ModelInfoModal 
        open={showModelModal} 
        onOpenChange={setShowModelModal}
      />
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
} 