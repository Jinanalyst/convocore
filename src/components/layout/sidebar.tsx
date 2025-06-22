"use client";

import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Real chat data from Supabase
  const [chats, setChats] = useState<Chat[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Load real data on component mount
  useEffect(() => {
    loadChats();
    loadLibraryItems();
  }, []);

  const loadChats = async () => {
    try {
      // Check if wallet is connected first
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const magicLinkAuth = document.cookie.includes('auth_method=magic_link');
      
      if (walletConnected) {
        // For wallet users, load chats from localStorage
        const savedChats = localStorage.getItem('wallet_chats');
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            setChats(parsedChats);
          } catch (parseError) {
            console.error('Error parsing saved chats:', parseError);
            setChats([]);
          }
        } else {
          setChats([]);
        }
        console.log('Loaded chats for wallet user');
        return;
      }

      if (magicLinkAuth) {
        // For magic link users, load chats from localStorage
        const savedChats = localStorage.getItem('magic_link_chats');
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            setChats(parsedChats);
          } catch (parseError) {
            console.error('Error parsing saved chats:', parseError);
            setChats([]);
          }
        } else {
          setChats([]);
        }
        console.log('Loaded chats for magic link user');
        return;
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, using empty chat list');
        setChats([]);
        return;
      }

      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError.message);
        setChats([]);
        return;
      }

      if (!user) {
        console.log('User not authenticated, using empty chat list');
        setChats([]);
        return;
      }
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          model,
          created_at,
          updated_at,
          messages (
            content,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Database error loading chats:', error.message, error.details);
        setChats([]);
        return;
      }

      const formattedChats: Chat[] = conversations?.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.messages?.[conv.messages.length - 1]?.content || 'No messages yet',
        timestamp: new Date(conv.updated_at),
      })) || [];

      setChats(formattedChats);
      console.log(`Loaded ${formattedChats.length} chats for authenticated user`);
    } catch (error) {
      console.error('Error loading chats:', error instanceof Error ? error.message : 'Unknown error', error);
      // Fallback to empty array if Supabase not configured
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibraryItems = async () => {
    try {
      // Default Convocore library items
      const defaultItems: LibraryItem[] = [
        {
          id: 'default-1',
          title: '🧠 Convocore Ideation Prompt',
          type: 'prompt',
          description: 'Generate 5 innovative agent ideas based on the task provided.',
          content: 'You are designing a new AI agent for this task: "{{task}}". Suggest 5 unique features or roles this agent could perform that differentiate it from existing tools.',
          createdAt: new Date()
        },
        {
          id: 'default-2',
          title: '📄 Convocore API Template',
          type: 'template',
          description: 'Summarize API endpoints into easy-to-read docs with example requests.',
          content: 'Given the following API spec, generate concise documentation with curl and JS usage examples. Explain each endpoint simply. \n\nAPI Spec:\n{{api_spec}}',
          createdAt: new Date()
        },
        {
          id: 'default-3',
          title: '🔍 Convocore Debug Assistant',
          type: 'prompt',
          description: 'Diagnose and suggest fixes for the given error message and code.',
          content: 'Analyze the following code and error message. Find the root cause and suggest 2 possible fixes.\n\nError: {{error_message}}\n\nCode:\n```{{code}}```',
          createdAt: new Date()
        },
        {
          id: 'default-4',
          title: '💬 ConvoAgent Role Trainer',
          type: 'template',
          description: 'Define tone, behavior, and logic for a new conversational agent.',
          content: 'Create a role definition for an AI agent named \'{{agent_name}}\'.\n\nContext: {{context}}\nTone: {{tone}}\nAbilities: {{abilities}}\nLimitations: {{limitations}}',
          createdAt: new Date()
        },
        {
          id: 'default-5',
          title: '🎨 Convocore Brand Voice Generator',
          type: 'prompt',
          description: 'Generate a consistent brand voice for product, blog, and UI.',
          content: 'You are branding a product called \'{{product_name}}\'. Generate a tone guide and example phrases for UI labels, emails, and landing page content.',
          createdAt: new Date()
        }
      ];

      // Check if user is authenticated
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const magicLinkAuth = document.cookie.includes('auth_method=magic_link');

      if (walletConnected || magicLinkAuth) {
        // For wallet/magic link users, always include defaults
        setLibraryItems(defaultItems);
        return;
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, using default library items');
        setLibraryItems(defaultItems);
        return;
      }

      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('User not authenticated, using default library items');
        setLibraryItems(defaultItems);
        return;
      }

      // Try to get user's custom library items
      const { data: customItems, error } = await supabase
        .from('library_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error loading library items:', error.message);
        setLibraryItems(defaultItems);
        return;
      }

      // Convert database items and merge with defaults
      const dbItems: LibraryItem[] = customItems?.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        content: item.content,
        createdAt: new Date(item.created_at)
      })) || [];

      // Always include defaults plus any custom items
      const allItems = [...defaultItems, ...dbItems];
      setLibraryItems(allItems);
      console.log(`Loaded ${allItems.length} library items (${defaultItems.length} defaults + ${dbItems.length} custom)`);
    } catch (error) {
      console.error('Error loading library items:', error);
      // Fallback to defaults
      setLibraryItems([
        {
          id: 'default-1',
          title: '🧠 Convocore Ideation Prompt',
          type: 'prompt',
          description: 'Generate 5 innovative agent ideas based on the task provided.',
          content: 'You are designing a new AI agent for this task: "{{task}}". Suggest 5 unique features or roles this agent could perform that differentiate it from existing tools.',
          createdAt: new Date()
        },
        {
          id: 'default-2',
          title: '📄 Convocore API Template',
          type: 'template',
          description: 'Summarize API endpoints into easy-to-read docs with example requests.',
          content: 'Given the following API spec, generate concise documentation with curl and JS usage examples. Explain each endpoint simply. \n\nAPI Spec:\n{{api_spec}}',
          createdAt: new Date()
        },
        {
          id: 'default-3',
          title: '🔍 Convocore Debug Assistant',
          type: 'prompt',
          description: 'Diagnose and suggest fixes for the given error message and code.',
          content: 'Analyze the following code and error message. Find the root cause and suggest 2 possible fixes.\n\nError: {{error_message}}\n\nCode:\n```{{code}}```',
          createdAt: new Date()
        },
        {
          id: 'default-4',
          title: '💬 ConvoAgent Role Trainer',
          type: 'template',
          description: 'Define tone, behavior, and logic for a new conversational agent.',
          content: 'Create a role definition for an AI agent named \'{{agent_name}}\'.\n\nContext: {{context}}\nTone: {{tone}}\nAbilities: {{abilities}}\nLimitations: {{limitations}}',
          createdAt: new Date()
        },
        {
          id: 'default-5',
          title: '🎨 Convocore Brand Voice Generator',
          type: 'prompt',
          description: 'Generate a consistent brand voice for product, blog, and UI.',
          content: 'You are branding a product called \'{{product_name}}\'. Generate a tone guide and example phrases for UI labels, emails, and landing page content.',
          createdAt: new Date()
        }
      ]);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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
            <Library className="w-4 h-4 mr-2" />
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
            <Library className="w-4 h-4" />
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
            <Bot className="w-4 h-4 mr-2" />
            Model Info
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
            <Bot className="w-4 h-4" />
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
                              {formatTimestamp(chat.timestamp)}
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