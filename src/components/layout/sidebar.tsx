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
  activeChatId?: string;
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'prompt' | 'conversation' | 'template';
  description: string;
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
  activeChatId 
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
      
      // For now, we'll create some default library items
      // In a real app, you'd have a library table in your database
      const defaultLibraryItems: LibraryItem[] = [
        {
          id: '1',
          title: 'Code Review Prompt',
          type: 'prompt',
          description: 'Comprehensive code review template for various programming languages',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Technical Writing Assistant',
          type: 'template',
          description: 'Template for creating technical documentation and API guides',
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'Blockchain Development Chat',
          type: 'conversation',
          description: 'Saved conversation about TRON smart contract development',
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
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800",
      className
    )}>
      {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
        <ConvocoreLogo size="lg" />
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="px-4 pb-4 space-y-1">
        <Button 
          variant="ghost" 
          onClick={handleSearch}
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <Search className="w-4 h-4" />
          Search
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleLibrary}
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <Library className="w-4 h-4" />
          Library
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleModelInfo}
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <Bot className="w-4 h-4" />
          Convocore Model
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            Recent Chats
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2">
          {filteredChats.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? "No chats found" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                    activeChatId === chat.id 
                      ? "bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700" 
                      : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                  )}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium text-sm truncate",
                        activeChatId === chat.id 
                          ? "text-gray-900 dark:text-white" 
                          : "text-gray-900 dark:text-white"
                      )}>
                        {chat.title}
                      </h4>
                      <p className={cn(
                        "text-xs truncate mt-1",
                        activeChatId === chat.id 
                          ? "text-gray-600 dark:text-gray-300" 
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {chat.lastMessage}
                      </p>
                      <span className={cn(
                        "text-xs mt-1 block",
                        activeChatId === chat.id 
                          ? "text-gray-600 dark:text-gray-400" 
                          : "text-gray-400 dark:text-gray-500"
                      )}>
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    {(hoveredChatId === chat.id || activeChatId === chat.id) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-zinc-700"
                          onClick={(e) => handleChatAction(e, 'edit', chat.id)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                          onClick={(e) => handleChatAction(e, 'delete', chat.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <Button 
          variant="ghost" 
          onClick={() => setShowSettingsModal(true)}
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Modals */}
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal} 
      />

      {/* Search Modal */}
      {showSearchModal && (
        <SearchModal 
          open={showSearchModal}
          onOpenChange={setShowSearchModal}
          chats={chats}
          onSelectChat={onSelectChat}
        />
      )}

      {/* Library Modal */}
      {showLibraryModal && (
        <LibraryModal 
          open={showLibraryModal}
          onOpenChange={setShowLibraryModal}
          items={libraryItems}
        />
      )}

      {/* Model Info Modal */}
      {showModelModal && (
        <ModelInfoModal 
          open={showModelModal}
          onOpenChange={setShowModelModal}
        />
      )}
    </div>
  );
} 