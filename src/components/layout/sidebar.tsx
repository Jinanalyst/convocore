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
  History
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

  // Real chat data from Supabase
  const [chats, setChats] = useState<Chat[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      // Convocore Library Items with prompts and templates
      const defaultLibraryItems: LibraryItem[] = [
        {
          id: '1',
          title: '🧠 Convocore Ideation Prompt',
          type: 'prompt',
          description: 'Generate 5 innovative agent ideas based on the task provided.',
          content: 'You are designing a new AI agent for this task: "{{task}}". Suggest 5 unique features or roles this agent could perform that differentiate it from existing tools.',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: '📄 Convocore API Template',
          type: 'template',
          description: 'Summarize API endpoints into easy-to-read docs with example requests.',
          content: 'Given the following API spec, generate concise documentation with curl and JS usage examples. Explain each endpoint simply. \n\nAPI Spec:\n{{api_spec}}',
          createdAt: new Date(),
        },
        {
          id: '3',
          title: '🔍 Convocore Debug Assistant',
          type: 'prompt',
          description: 'Diagnose and suggest fixes for the given error message and code.',
          content: 'Analyze the following code and error message. Find the root cause and suggest 2 possible fixes.\n\nError: {{error_message}}\n\nCode:\n```{{code}}```',
          createdAt: new Date(),
        },
        {
          id: '4',
          title: '💬 ConvoAgent Role Trainer',
          type: 'template',
          description: 'Define tone, behavior, and logic for a new conversational agent.',
          content: 'Create a role definition for an AI agent named \'{{agent_name}}\'.\n\nContext: {{context}}\nTone: {{tone}}\nAbilities: {{abilities}}\nLimitations: {{limitations}}',
          createdAt: new Date(),
        },
        {
          id: '5',
          title: '🎨 Convocore Brand Voice Generator',
          type: 'prompt',
          description: 'Generate a consistent brand voice for product, blog, and UI.',
          content: 'You are branding a product called \'{{product_name}}\'. Generate a tone guide and example phrases for UI labels, emails, and landing page content.',
          createdAt: new Date(),
        },
      ];

      setLibraryItems(defaultLibraryItems);
    } catch (error) {
      console.error('Error loading library items:', error);
      setLibraryItems([]);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleChatAction = async (e: React.MouseEvent, action: 'edit' | 'delete', chatId: string) => {
    e.stopPropagation();
    if (action === 'delete') {
      try {
        // Check authentication method
        const walletConnected = localStorage.getItem('wallet_connected') === 'true';
        const magicLinkAuth = document.cookie.includes('auth_method=magic_link');
        
        if (walletConnected || magicLinkAuth) {
          // For wallet and magic link users, just update local state and delegate to parent
          setChats(prev => prev.filter(chat => chat.id !== chatId));
          onDeleteChat?.(chatId);
          return;
        }

        // For Supabase users, delete from database
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

        // Update local state
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        onDeleteChat?.(chatId);
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
    // Edit functionality can be added later
  };

  const handleNewChat = async () => {
    try {
      // Check authentication method
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const magicLinkAuth = document.cookie.includes('auth_method=magic_link');
      
      if (walletConnected || magicLinkAuth) {
        // For wallet and magic link users, delegate to parent component
        // The parent component will handle the localStorage operations
        onNewChat?.();
        return;
      }

      // For Supabase users, create in database
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: `New Chat ${new Date().toLocaleDateString()}`,
          model: 'gpt-4o'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new chat:', error);
        return;
      }

      // Add to local state
      const newChat: Chat = {
        id: newConversation.id,
        title: newConversation.title,
        lastMessage: 'Start a new conversation...',
        timestamp: new Date(newConversation.created_at),
      };

      setChats(prev => [newChat, ...prev]);
      onNewChat?.();
      onSelectChat?.(newConversation.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Fallback to callback if Supabase not configured
      onNewChat?.();
    }
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const handleLibrary = () => {
    setShowLibraryModal(true);
  };

  const handleModelInfo = () => {
    setShowModelModal(true);
  };

  return (
    <>
      <aside className={cn(
        "flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-80",
        "h-full overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800",
          isCollapsed && "justify-center px-2"
        )}>
          {!isCollapsed && (
            <ConvocoreLogo size="md" className="flex-shrink-0" />
          )}
          {isCollapsed && (
            <ConvocoreLogo size="sm" showText={false} className="flex-shrink-0" />
          )}
          
          {/* Collapse Toggle - Hidden on mobile since mobile uses overlay */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex shrink-0",
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
        <div className={cn("p-3", isCollapsed && "px-2")}>
          <Button
            onClick={handleNewChat}
            className={cn(
              "w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors",
              isCollapsed ? "px-0 justify-center" : "justify-start gap-3"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </Button>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
                className="justify-start gap-2 text-xs"
              >
                <Search className="h-3 w-3" />
                Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLibrary}
                className="justify-start gap-2 text-xs"
              >
                <Library className="h-3 w-3" />
                Library
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed Quick Actions */}
        {isCollapsed && (
          <div className="px-2 pb-3 space-y-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              className="w-full"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLibrary}
              className="w-full"
              title="Library"
            >
              <Library className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          {!isCollapsed && (
            <div className="px-3 pb-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent Chats
              </h3>
            </div>
          )}
          
          <div className={cn(
            "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent",
            isCollapsed ? "px-2" : "px-3"
          )}>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "animate-pulse bg-gray-200 dark:bg-zinc-800 rounded-lg",
                      isCollapsed ? "h-10 w-10 mx-auto" : "h-12"
                    )}
                  />
                ))}
              </div>
            ) : chats.length === 0 ? (
              !isCollapsed && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No chats yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Start a new conversation
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative rounded-lg transition-all duration-200",
                      chat.isActive || activeChatId === chat.id
                        ? "bg-gray-100 dark:bg-zinc-800"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    )}
                    onMouseEnter={() => setHoveredChatId(chat.id)}
                    onMouseLeave={() => setHoveredChatId(null)}
                  >
                    <button
                      onClick={() => onSelectChat?.(chat.id)}
                      className={cn(
                        "w-full text-left transition-all duration-200",
                        isCollapsed ? "p-2 flex justify-center" : "p-3"
                      )}
                      title={isCollapsed ? chat.title : undefined}
                    >
                      {isCollapsed ? (
                        <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {chat.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {chat.lastMessage}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleChatAction(e, 'edit', chat.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                                title="Edit chat"
                              >
                                <Edit3 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={(e) => handleChatAction(e, 'delete', chat.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                title="Delete chat"
                              >
                                <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimestamp(chat.timestamp)}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={cn(
          "border-t border-gray-200 dark:border-zinc-800",
          isCollapsed ? "p-2 space-y-2" : "p-3 space-y-2"
        )}>
          {isCollapsed ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleModelInfo}
                className="w-full"
                title="Model Info"
              >
                <Bot className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsModal(true)}
                className="w-full"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleModelInfo}
                className="w-full justify-start gap-3 text-sm"
              >
                <Bot className="h-4 w-4" />
                Model Info
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSettingsModal(true)}
                className="w-full justify-start gap-3 text-sm"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Modals */}
      <SearchModal 
        open={showSearchModal} 
        onOpenChange={setShowSearchModal}
      />
      
      <LibraryModal 
        open={showLibraryModal} 
        onOpenChange={setShowLibraryModal}
        items={libraryItems}
        onUseItem={onUseLibraryItem}
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