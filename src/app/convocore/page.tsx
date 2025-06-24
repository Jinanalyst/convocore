"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { PWAInstall } from "@/components/ui/pwa-install";
import { VoiceAssistant } from "@/components/assistant/voice-assistant";
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
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
      console.log('🔄 Loading chats...');
      
      // Check if user is authenticated via wallet or Supabase
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // For wallet users, fetch from backend API
        try {
          const res = await fetch('/api/wallet/conversations');
          if (res.ok) {
            const json = await res.json();
            const fetchedChats: Chat[] = json.conversations.map((conv: any) => ({
              id: conv.id,
              title: conv.title,
              lastMessage: 'Start a new conversation...',
              timestamp: new Date(conv.updated_at)
            }));
            setChats(fetchedChats);
            console.log('📥 Loaded', fetchedChats.length, 'wallet conversations from backend');
            // Cache locally for offline use
            localStorage.setItem('wallet_chats', JSON.stringify(fetchedChats));
            return;
          }
        } catch(err) {
          console.warn('Failed to fetch wallet conversations, falling back to localStorage');
        }

        // Fallback to localStorage demo or stored data
        const savedChats = localStorage.getItem('wallet_chats');
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        }
        return;
      }

      // Check for local storage chats (fallback for unauthenticated users)
      const localChats = localStorage.getItem('local_chats');
      if (localChats) {
        const parsedLocalChats = JSON.parse(localChats);
        const realLocalChats = parsedLocalChats.filter((chat: Chat) => 
          !chat.id.startsWith('demo_') && chat.lastMessage !== 'Hello! How can I help you today?'
        );
        
        if (realLocalChats.length > 0) {
          setChats(realLocalChats);
          console.log('📥 Loaded', realLocalChats.length, 'local chats');
          return;
        }
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
        console.warn('Could not load Supabase chats (expected if not configured):', error);
        // Fallback to demo chats for users without Supabase
        const demoChats: Chat[] = [
          {
            id: `demo_${Date.now()}_1`,
            title: "AI Assistant",
            lastMessage: "Hello! How can I help you today?",
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            id: `demo_${Date.now()}_2`,
            title: "Code Generation",
            lastMessage: "I can help you write and debug code...",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
        ];
        setChats(demoChats);
        console.log('📝 Loaded demo chats (Supabase unavailable)');
      } else {
        const formattedChats: Chat[] = conversations?.map(conv => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.messages?.[conv.messages.length - 1]?.content || 'No messages yet',
          timestamp: new Date(conv.updated_at),
        })) || [];

        // If no conversations exist, show demo chats
        if (formattedChats.length === 0) {
          const demoChats: Chat[] = [
            {
              id: `demo_${Date.now()}_1`,
              title: "AI Assistant",
              lastMessage: "Hello! How can I help you today?",
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
            },
            {
              id: `demo_${Date.now()}_2`,
              title: "Code Generation",
              lastMessage: "I can help you write and debug code...",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            },
          ];
          setChats(demoChats);
          console.log('📝 No Supabase conversations found, showing demo chats');
        } else {
          setChats(formattedChats);
          console.log('📥 Loaded', formattedChats.length, 'Supabase conversations');
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      // Fallback to demo chats
      const demoChats: Chat[] = [
        {
          id: `demo_${Date.now()}_1`,
          title: "AI Assistant",
          lastMessage: "Hello! How can I help you today?",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: `demo_${Date.now()}_2`,
          title: "Code Generation",
          lastMessage: "I can help you write and debug code...",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ];
      setChats(demoChats);
      console.log('🆘 Error loading chats, fallback to demo chats');
    }
  };

  const handleSelectChat = (chatId: string) => {
    console.log('🎯 Selecting chat:', chatId);
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
    } else {
      // Persist deletion for local users
      localStorage.setItem('local_chats', JSON.stringify(updatedChats));
    }
  };

  const handleSendMessage = async (message: string, model: string, includeWebSearch?: boolean): Promise<string | undefined> => {
    console.log("Sending message:", message, "with model:", model, "web search:", includeWebSearch);
    
    // Update the current chat's last message and timestamp
    if (activeChatId) {
      const updatedChats = chats.map(chat => {
        if (chat.id !== activeChatId) return chat;

        // Determine new title: keep existing if user already set one; otherwise use first 30 chars
        const defaultTitlePattern = /^New Chat/;
        const newTitle = defaultTitlePattern.test(chat.title)
          ? (message.length > 30 ? message.substring(0, 30) + '...' : message)
          : chat.title;

        return {
          ...chat,
          title: newTitle,
          lastMessage: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          timestamp: new Date()
        };
      });
      setChats(updatedChats);
      
      // Update localStorage for wallet or local users
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      if (walletConnected) {
        localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
      } else {
        localStorage.setItem('local_chats', JSON.stringify(updatedChats));
      }
    } else {
      // If no active chat, create a new chat and return its id
      const newId = await handleNewChat(message);
      return newId;
    }

    return activeChatId;
  };

  const handleShare = () => {
    if (!activeChatId) {
      console.log('⚠️ No active chat to share');
      return;
    }

    console.log("✅ Share button clicked! Opening share modal for chat:", activeChatId);
    console.log("Current chat title:", getCurrentChatTitle());
    setShareModalOpen(true);
  };

  const handleSettings = () => {
    console.log("✅ Settings button clicked! Opening settings modal");
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

  const handleNewChat = async (initialMessage?: string) => {
    try {
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // For wallet users, create chat via backend API
        try {
          const title = initialMessage ? 
            (initialMessage.length > 30 ? initialMessage.substring(0, 30) + '...' : initialMessage) :
            `New Chat ${new Date().toLocaleDateString()}`;
          const res = await fetch('/api/wallet/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });

          if (res.ok) {
            const json = await res.json();
            const newConv = json.conversation;
            const newChatId = newConv.id;
            const newChat: Chat = {
              id: newChatId,
              title: newConv.title,
              lastMessage: initialMessage || 'Start a new conversation...',
              timestamp: new Date(newConv.created_at),
            };

            const updatedChats = [newChat, ...chats];
            setChats(updatedChats);
            setActiveChatId(newChatId);
            // Cache locally
            localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
            console.log('✅ Created new wallet chat via backend:', newChatId);
            return newChatId;
          }
        } catch(err) {
          console.error('Failed to create wallet conversation via backend, falling back to local');
        }

        // Fallback to local only
        const newChatId = `wallet_chat_${Date.now()}`;
        const newChat: Chat = {
          id: newChatId,
          title: initialMessage ? 
            (initialMessage.length > 30 ? initialMessage.substring(0, 30) + '...' : initialMessage) :
            `New Chat ${new Date().toLocaleDateString()}`,
          lastMessage: initialMessage || 'Start a new conversation...',
          timestamp: new Date(),
        };
        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setActiveChatId(newChatId);
        localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
        return newChatId;
      }

      // For Supabase authenticated users
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        // Fallback to local storage for unauthenticated users
        const newChatId = `local_chat_${Date.now()}`;
        const newChat: Chat = {
          id: newChatId,
          title: initialMessage ? 
            (initialMessage.length > 30 ? initialMessage.substring(0, 30) + '...' : initialMessage) :
            `New Chat ${new Date().toLocaleDateString()}`,
          lastMessage: initialMessage || 'Start a new conversation...',
          timestamp: new Date(),
        };

        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setActiveChatId(newChatId);
        
        // Save to localStorage as fallback
        localStorage.setItem('local_chats', JSON.stringify(updatedChats));
        console.log('📦 Created fallback local chat:', newChatId);
        return newChatId;
      }

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: initialMessage ? 
            (initialMessage.length > 30 ? initialMessage.substring(0, 30) + '...' : initialMessage) :
            `New Chat ${new Date().toLocaleDateString()}`,
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
        lastMessage: initialMessage || 'Start a new conversation...',
        timestamp: new Date(newConversation.created_at),
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setActiveChatId(newConversation.id);
      console.log('✅ Created new Supabase chat:', newConversation.id);
      
      // Also persist locally so the chat appears in recent chats even if Supabase is unavailable later
      localStorage.setItem('local_chats', JSON.stringify(updatedChats));
      return newConversation.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Fallback to just clearing active chat
      setActiveChatId(null);
    }
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
              "fixed left-0 top-0 h-full transform",
              sidebarCollapsed ? "-translate-x-full" : "translate-x-0 w-80"
            )
          : cn(
              "flex-shrink-0",
              sidebarCollapsed ? "w-16" : "w-80"
            )
      )}>
        <Sidebar
          className="h-full"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          showMobileMenu={!sidebarCollapsed}
        />

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        chatId={activeChatId || undefined}
        chatTitle={getCurrentChatTitle()}
      />

      {/* PWA Install Component */}
      <PWAInstall />

      {/* Voice Assistant microphone */}
      <VoiceAssistant />
    </div>
  );
} 