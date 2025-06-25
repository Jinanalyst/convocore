"use client";

// Force this page to be rendered dynamically, avoiding static pre-render/Suspense issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { PWAInstall } from "@/components/ui/pwa-install";
import { VoiceAssistant } from "@/components/assistant/voice-assistant";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { invokeAssistant } from '@/lib/assistant/openai-assistant-service';
import { usageService } from '@/lib/usage-service';
import { useSearchParams } from 'next/navigation';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  threadId?: string;
}

export default function ConvocorePage() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [usage, setUsage] = useState({
    used: 0,
    limit: 3,
    plan: 'free' as 'free' | 'pro' | 'premium',
  });

  const searchParams = useSearchParams();
  const queryChatId = searchParams.get('chatId');

  // Persist chats locally whenever they change
  useEffect(() => {
    if (chats.length === 0) return;
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';
    const key = walletConnected ? 'wallet_chats' : 'local_chats';
    try {
      localStorage.setItem(key, JSON.stringify(chats));
      console.log('💾 Chats saved to', key, chats.length);
    } catch (err) {
      console.warn('Failed to save chats to localStorage', err);
    }
  }, [chats]);

  // Load chats and usage on component mount
  useEffect(() => {
    loadChats();
    loadUsage();
    
    // Listen for usage updates from other tabs/windows
    window.addEventListener('usageUpdated', loadUsage);
    
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
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('usageUpdated', loadUsage);
    };
  }, [user]); // Rerun when user changes

  // Auto-select the first chat when chats are loaded and no chat is active
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      console.log('🤖 Auto-selecting first chat:', chats[0].id);
      handleSelectChat(chats[0].id);
    }
  }, [chats]);

  useEffect(() => {
    if (queryChatId && chats.length > 0) {
      const exists = chats.some(c => c.id === queryChatId);
      if (exists) {
        console.log('🏷 routing to chat from URL param', queryChatId);
        handleSelectChat(queryChatId);
      }
    }
  }, [chats, queryChatId]);

  const loadUsage = () => {
    const userId = user?.id ?? 'local';
    try {
      const userUsage = usageService.getUserUsage(userId);
      const subscription = usageService.getUserSubscription(userId);
      setUsage({
        used: userUsage.requestsUsed,
        limit: subscription.tier === 'free' ? userUsage.requestsLimit : -1,
        plan: subscription.tier,
      });
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const loadChats = async () => {
    try {
      console.log('🔄 Loading chats...');
      
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        try {
          const res = await fetch('/api/wallet/conversations');
          if (res.ok) {
            const json = await res.json();
            const fetchedChats: Chat[] = json.conversations.map((conv: any) => ({
              id: conv.id,
              title: conv.title,
              lastMessage: 'Start a new conversation...',
              timestamp: new Date(conv.updated_at),
              threadId: conv.thread_id,
            }));
            setChats(fetchedChats);
            console.log('📥 Loaded', fetchedChats.length, 'wallet conversations from backend');
            localStorage.setItem('wallet_chats', JSON.stringify(fetchedChats));
            return;
          }
        } catch(err) {
          console.warn('Failed to fetch wallet conversations, falling back to localStorage');
        }

        const savedChats = localStorage.getItem('wallet_chats');
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        }
        return;
      }

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

      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          thread_id,
          messages (
            content,
            created_at
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Could not load Supabase chats (expected if not configured):', error);
        const demoChats: Chat[] = [
          { id: `demo_${Date.now()}_1`, title: "AI Assistant", lastMessage: "Hello! How can I help you today?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
          { id: `demo_${Date.now()}_2`, title: "Code Generation", lastMessage: "I can help you write and debug code...", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        ];
        setChats(demoChats);
        console.log('📝 Loaded demo chats (Supabase unavailable)');
      } else {
        const formattedChats: Chat[] = conversations?.map(conv => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.messages?.[conv.messages.length - 1]?.content || 'No messages yet',
          timestamp: new Date(conv.updated_at),
          threadId: conv.thread_id,
        })) || [];

        if (formattedChats.length === 0) {
          const demoChats: Chat[] = [
            { id: `demo_${Date.now()}_1`, title: "AI Assistant", lastMessage: "Hello! How can I help you today?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
            { id: `demo_${Date.now()}_2`, title: "Code Generation", lastMessage: "I can help you write and debug code...", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
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
      const demoChats: Chat[] = [
        { id: `demo_${Date.now()}_1`, title: "AI Assistant", lastMessage: "Hello! How can I help you today?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { id: `demo_${Date.now()}_2`, title: "Code Generation", lastMessage: "I can help you write and debug code...", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      ];
      setChats(demoChats);
      console.log('🆘 Error loading chats, fallback to demo chats');
    }
  };

  const handleSelectChat = async (chatId: string) => {
    console.log('🎯 Selecting chat:', chatId);
    console.log('💬 Fetching /api/chat/' + chatId);
    setActiveChatId(chatId);
    setIsChatLoading(true);
    setMessages([]);

    const selectedChat = chats.find(c => c.id === chatId);
    const fetchId = selectedChat?.threadId || chatId;

    setThreadId(selectedChat?.threadId || null);

    try {
      const response = await fetch(`/api/chat/${fetchId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      const chatMessages = await response.json();

      const formattedMessages = chatMessages.map((msg: any, index: number) => ({
        ...msg,
        id: msg.id || `msg-${index}`
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('🛑 Error fetching messages for chat:', chatId, error);
      setMessages([{ id: 'error-message', role: 'assistant', content: error.message || 'Could not load messages.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setThreadId(null);
      setMessages([]);
    }
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';
    if (walletConnected) {
      localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
    } else {
      localStorage.setItem('local_chats', JSON.stringify(updatedChats));
    }
  };

  const handleSendMessage = async (message: string, model: string, includeWebSearch?: boolean) => {
    console.log("Sending message:", message, "with model:", model, "web search:", includeWebSearch);

    let currentChatId = activeChatId;

    if (!currentChatId) {
      const newChatId = await handleNewChat(message, true);
      if (newChatId) {
        currentChatId = newChatId;
      } else {
        console.error("Failed to create a new chat, message not sent.");
        const errorMessage: Message = { id: `err-${Date.now()}`, role: 'assistant', content: "Sorry, I couldn't start a new chat. Please try again." };
        setMessages([errorMessage]);
        return;
      }
    }

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    usageService.incrementUsage(user?.id ?? 'local');

    let reply = "Assistant is thinking...";
    try {
      const assistantResponse = await invokeAssistant(message, threadId);
      reply = assistantResponse.reply;
      console.log("Assistant says:", reply);
      setThreadId(assistantResponse.threadId);
      
      const assistantMessage: Message = { id: `asst-${Date.now()}`, role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMessage]);

      const chatToUpdate = chats.find(c => c.id === currentChatId);
      if (chatToUpdate && !chatToUpdate.threadId) {
        try {
          const { createClientComponentClient } = await import('@/lib/supabase');
          const supabase = createClientComponentClient();
          await supabase
            .from('conversations')
            .update({ thread_id: assistantResponse.threadId })
            .eq('id', currentChatId);
          
          setChats(prev => prev.map(c => c.id === currentChatId ? {...c, threadId: assistantResponse.threadId} : c));

        } catch (error) {
          console.error('Failed to update thread_id in Supabase:', error);
        }
      }

    } catch (error) {
      console.error("Error calling assistant:", error);
      reply = "Sorry, I couldn't respond.";
      const errorMessage: Message = { id: `err-${Date.now()}`, role: 'assistant', content: reply };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              lastMessage: reply.substring(0, 50) + (reply.length > 50 ? '...' : ''),
              timestamp: new Date()
            }
          : chat
      );
      
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      if (walletConnected) {
        localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
      } else {
        localStorage.setItem('local_chats', JSON.stringify(updatedChats));
      }
      
      return updatedChats;
    });
  };

  const handleShare = () => {
    if (!activeChatId) {
      console.log('⚠️ No active chat to share');
      return;
    }
    console.log("✅ Share button clicked! Opening share modal for chat:", activeChatId);
    setShareModalOpen(true);
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const handleProfile = () => {
    console.log("Opening profile");
  };

  const handleLogout = async () => {
    console.log("Logging out");
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';
    if (walletConnected) {
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_type');
      localStorage.removeItem('user_id');
      localStorage.removeItem('wallet_chats');
      document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
      window.location.href = '/auth/login';
    } else {
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

  const handleNewChat = async (initialMessage?: string, isContinuation = false): Promise<string | undefined> => {
    console.log('✨ Creating new chat...');

    if (!isContinuation) {
      setMessages([]);
      setThreadId(null);
      setActiveChatId(null);
    }

    const newChatTitle = initialMessage ? `Chat about "${initialMessage.substring(0, 20)}..."` : "New Chat";
    const newThreadId = `thread_${Date.now()}`;

    try {
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();

      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) {
        console.error('User not authenticated, creating local chat');
        const tempId = `local_chat_${Date.now()}`;
        const newChat: Chat = { 
            id: tempId, 
            title: newChatTitle, 
            lastMessage: initialMessage || 'Start...', 
            timestamp: new Date(),
            threadId: newThreadId,
        };
        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setActiveChatId(tempId);
        setThreadId(newThreadId);
        // No need to save to local_chats here, it will be handled by the auto-save mechanism
        return tempId;
      }

      let newConversation;
      try {
        const { data } = await supabase
          .from('conversations')
          .insert({ user_id: supabaseUser.id, title: newChatTitle, model: 'gpt-4o', thread_id: newThreadId })
          .select()
          .single();
        newConversation = data;
      } catch (e: any) {
        console.warn('Insert with thread_id failed, retrying without column', e);
      }
      if (!newConversation) {
        const { data, error: fallbackErr } = await supabase
          .from('conversations')
          .insert({ user_id: supabaseUser.id, title: newChatTitle, model: 'gpt-4o' })
          .select()
          .single();
        if (fallbackErr) { console.error('Fallback insert error', fallbackErr); return undefined; }
        newConversation = data;
      }

      const newChat: Chat = {
        id: newConversation.id,
        title: newConversation.title,
        lastMessage: initialMessage || 'Start...',
        timestamp: new Date(newConversation.created_at),
        threadId: newConversation.thread_id,
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setActiveChatId(newConversation.id);
      setThreadId(newConversation.thread_id);
      return newConversation.id;

    } catch (error) {
      console.error('Error creating new chat:', error);
      setActiveChatId(null);
      return undefined;
    }
  };

  const debouncedSaveChats = () => {
    // ... existing code ...
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <div className={cn(
        "transition-all duration-300 z-50",
        isMobile 
          ? cn("fixed left-0 top-0 h-full transform", sidebarCollapsed ? "-translate-x-full" : "translate-x-0 w-80")
          : cn("flex-shrink-0", sidebarCollapsed ? "w-16" : "w-80")
      )}>
        <Sidebar
          className="h-full"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewChat={() => handleNewChat()}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId);
            if (isMobile) setSidebarCollapsed(true);
          }}
          onDeleteChat={handleDeleteChat}
          activeChatId={activeChatId || undefined}
          chats={chats}
        />
      </div>

      <div className={cn("flex-1 flex flex-col min-w-0", isMobile ? "w-full" : "")}>
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

        <div className="flex-1 min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            onSendMessage={handleSendMessage}
            messages={messages}
            usage={usage}
            isLoading={isChatLoading}
          />
        </div>
      </div>

      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        chatId={activeChatId || undefined}
        chatTitle={getCurrentChatTitle()}
      />

      <PWAInstall />
      <VoiceAssistant onSend={(message) => handleSendMessage(message, 'default-model')} />
    </div>
  );
}
