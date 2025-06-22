"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      // Check if user is authenticated via wallet or Supabase
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // For wallet users, load chats from localStorage or provide demo data
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
          // Start with empty chat list for new wallet users
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

      // For Supabase authenticated users
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
    // In a real app, this would send the message to the AI service
  };

  const handleUseLibraryItem = (item: any) => {
    console.log("Using library item:", item);
    
    if (item.content) {
      // Copy the content to clipboard
      navigator.clipboard.writeText(item.content).then(() => {
        console.log("Template copied to clipboard:", item.title);
        
        // Create a new chat with the template title
        handleNewChat();
        
        // In a real implementation, you would also:
        // 1. Pre-fill the chat input with the template content
        // 2. Show a toast notification: "Template copied and ready to use!"
        // 3. Parse template variables like {{task}}, {{api_spec}}, etc.
        
        // For now, we'll use the notification service if available
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            title: 'Template Ready',
            message: `${item.title} has been copied to clipboard and a new chat started.`,
            type: 'success'
          });
        }
      }).catch(err => {
        console.error('Failed to copy template:', err);
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            title: 'Copy Failed',
            message: 'Failed to copy template to clipboard.',
            type: 'error'
          });
        }
      });
    }
  };

  const handleShare = async () => {
    if (!activeChatId) {
      console.log("No active chat to share");
      return;
    }

    try {
      // Generate a shareable link for the current chat
      const response = await fetch(`/api/chat/${activeChatId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: true,
          allowComments: false
        }),
      });

      if (response.ok) {
        const { shareUrl } = await response.json();
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        // Show notification
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            title: 'Share Link Created',
            message: 'Chat link copied to clipboard and ready to share!',
            type: 'success'
          });
        }
        
        console.log("Chat shared successfully:", shareUrl);
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Error sharing chat:', error);
      
      // Fallback: create a simple shareable URL
      const fallbackUrl = `${window.location.origin}/chat/${activeChatId}`;
      await navigator.clipboard.writeText(fallbackUrl);
      
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification({
          title: 'Share Link Ready',
          message: 'Basic share link copied to clipboard.',
          type: 'info'
        });
      }
    }
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
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300",
        sidebarCollapsed ? "w-0" : "w-80"
      )}>
        <Sidebar
          className="h-full"
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onUseLibraryItem={handleUseLibraryItem}
          activeChatId={activeChatId || undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
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

      {/* Sidebar Toggle Button (Mobile) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700"
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
    </div>
  );
} 