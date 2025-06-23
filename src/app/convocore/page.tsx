"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
import { PWAInstall } from "@/components/ui/pwa-install";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function ConvocorePage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);

  // Load chats on component mount and detect mobile
  useEffect(() => {
    loadChats();
    
    // Mobile detection
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      // On mobile, start with sidebar collapsed
      if (isMobileDevice) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadChats = async () => {
    try {
      // Check if user is authenticated via wallet or Supabase
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // For wallet users, load chats from localStorage or provide demo data
        const savedChats = localStorage.getItem('wallet_chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          setChats(parsedChats);
        } else {
          // Start with empty chat list for new wallet users
          setChats([]);
        }
        console.log('Loaded chats for wallet user');
        return;
      }

      // For Supabase authenticated users
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          messages (
            content,
            created_at
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      const formattedChats: Chat[] = conversations?.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.messages?.[conv.messages.length - 1]?.content || 'No messages yet',
        timestamp: new Date(conv.updated_at),
      })) || [];

      setChats(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      // Fallback to empty chats
      setChats([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // For wallet users, create chat locally
        const newChatId = `wallet_chat_${Date.now()}`;
        const newChat: Chat = {
          id: newChatId,
          title: `New Chat ${new Date().toLocaleDateString()}`,
          lastMessage: 'Start a new conversation...',
          timestamp: new Date(),
        };

        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setActiveChatId(newChatId);
        
        // Save to localStorage
        localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
        console.log('Created new chat for wallet user');
        return;
      }

      // For Supabase authenticated users
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
      setActiveChatId(newConversation.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Fallback to just clearing active chat
      setActiveChatId(null);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    
    // Remove from local state immediately for better UX
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // If wallet user, also update localStorage
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';
    if (walletConnected) {
      localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
    }
  };

  const handleSendMessage = (message: string, model: string, includeWebSearch?: boolean) => {
    console.log("Sending message:", message, "with model:", model, "web search:", includeWebSearch);
    
    // Update the current chat's last message and timestamp
    if (activeChatId) {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === activeChatId 
            ? { 
                ...chat, 
                lastMessage: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                timestamp: new Date()
              }
            : chat
        )
      );
      
      // Update localStorage for wallet users
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      if (walletConnected) {
        const updatedChats = chats.map(chat => 
          chat.id === activeChatId 
            ? { 
                ...chat, 
                lastMessage: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                timestamp: new Date()
              }
            : chat
        );
        localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
      }
    }
  };

  const handleShare = () => {
    console.log("Sharing chat");
    // In a real app, this would generate a shareable link or export
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const handleProfile = () => {
    console.log("Opening profile");
    // In a real app, this would open profile management
  };

  const handleLogout = async () => {
    console.log("Logging out");
    
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';
    
    if (walletConnected) {
      // Clear wallet authentication
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_type');
      localStorage.removeItem('user_id');
      localStorage.removeItem('wallet_chats');
      
      // Clear cookies
      document.cookie = 'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'wallet_address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'wallet_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Redirect to login
      window.location.href = '/auth/login';
    } else {
      // Handle Supabase logout
      try {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        await supabase.auth.signOut();
        window.location.href = '/auth/login';
      } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = '/auth/login';
      }
    }
  };

  const getCurrentChatTitle = () => {
    if (!activeChatId) return undefined;
    
    const currentChat = chats.find(chat => chat.id === activeChatId);
    return currentChat?.title;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar - Desktop: Normal layout, Mobile: Fixed overlay */}
      <div className={cn(
        "transition-all duration-300 z-50",
        isMobile 
          ? cn(
              "fixed left-0 top-0 h-full w-80 transform",
              sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
            )
          : cn(
              "flex-shrink-0",
              sidebarCollapsed ? "w-0" : "w-80"
            )
      )}>
        <Sidebar
          className="h-full"
          onNewChat={handleNewChat}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId);
            // Auto-close sidebar on mobile after selecting chat
            if (isMobile) {
              setSidebarCollapsed(true);
            }
          }}
          onDeleteChat={handleDeleteChat}
          activeChatId={activeChatId || undefined}
          chats={chats}
        />
      </div>

      {/* Main Content - Full width on mobile, adjusted on desktop */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isMobile ? "w-full" : ""
      )}>
        {/* Header */}
        <Header
          currentChatTitle={getCurrentChatTitle()}
          currentChatId={activeChatId || undefined}
          onShare={handleShare}
          onSettings={handleSettings}
          onProfile={handleProfile}
          onLogout={handleLogout}
        />

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Sidebar Toggle Button - Always visible on mobile, hidden on desktop when sidebar is open */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "fixed top-4 left-4 z-50 bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 transition-opacity",
          isMobile ? "block" : sidebarCollapsed ? "block" : "hidden"
        )}
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      {/* PWA Install Component */}
      <PWAInstall />
    </div>
  );
} 