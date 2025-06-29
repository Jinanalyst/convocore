"use client";

import { Suspense, useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { PWAInstall } from "@/components/ui/pwa-install";
import { VoiceAssistant } from "@/components/assistant/voice-assistant";
import { cn } from "@/lib/utils";
import { invokeAssistant } from '@/lib/assistant/openai-assistant-service';
import { usageService } from '@/lib/usage-service';
import { useSearchParams, useRouter } from 'next/navigation';

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

function ConvocorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatId = searchParams.get('chatId');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [demoChatMessages, setDemoChatMessages] = useState<Record<string, Message[]>>({});
  const [threadId, setThreadId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
    };
  }, []);

  // Auto-select the first chat when chats are loaded and no chat is active
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      console.log('🤖 Auto-selecting first chat:', chats[0].threadId || chats[0].id);
      handleSelectChat(chats[0].threadId || chats[0].id);
    }
  }, [chats]);

  useEffect(() => {
    if (queryChatId && chats.length > 0) {
      const exists = chats.some(c => c.threadId === queryChatId || c.id === queryChatId);
      if (exists) {
        console.log('🏷 routing to chat from URL param', queryChatId);
        handleSelectChat(queryChatId);
      }
    }
  }, [chats, queryChatId]);

  const loadChats = async () => {
    try {
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected) {
        // Load chats from Solana for wallet users
        const response = await fetch('/api/wallet/conversations');
        if (response.ok) {
          const data = await response.json();
          const fetchedChats: Chat[] = data.conversations.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            lastMessage: conv.lastMessage,
            timestamp: new Date(conv.updated_at),
            threadId: conv.thread_id,
          }));
          
          setChats(fetchedChats);
          localStorage.setItem('wallet_chats', JSON.stringify(fetchedChats));
          console.log('📥 Loaded', fetchedChats.length, 'Solana chats');
          return;
        } else {
          console.warn('Failed to fetch wallet conversations, falling back to localStorage');
        }
      }

      // Load from localStorage for unauthenticated users or as fallback
      const savedChats = walletConnected ? 
        localStorage.getItem('wallet_chats') : 
        localStorage.getItem('local_chats');
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        const realLocalChats = parsedChats.filter((chat: Chat) => 
          !chat.id.startsWith('demo_') && chat.lastMessage !== 'Hello! How can I help you today?'
        );
        
        if (realLocalChats.length > 0) {
          setChats(realLocalChats);
          console.log('📥 Loaded', realLocalChats.length, 'local chats');
          return;
        }
      }

      // Show demo chats for new users
      const demoChats: Chat[] = [
        { id: `demo_${Date.now()}_1`, title: "AI Assistant", lastMessage: "Hello! How can I help you today?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { id: `demo_${Date.now()}_2`, title: "Code Generation", lastMessage: "I can help you write and debug code...", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      ];
      setChats(demoChats);
      console.log('📝 Loaded demo chats for new user');
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

  const handleSelectChat = async (threadId: string) => {
    // Don't re-select the same chat
    if (activeChatId === threadId) {
      console.log('🎯 Chat already selected:', threadId);
      return;
    }

    router.replace(`/convocore?chatId=${threadId}`);
    console.log('🎯 Selecting chat (threadId):', threadId);
    setActiveChatId(threadId);
    setIsChatLoading(true);

    const selectedChat = chats.find(c => c.threadId === threadId || c.id === threadId);
    setThreadId(threadId);

    // Handle demo and local chats - they don't have server-side messages
    if (threadId.startsWith('demo_') || threadId.startsWith('local_chat_')) {
      console.log('📝 Demo/local chat detected, no server messages to fetch');
      
      // Restore messages for this demo chat if they exist
      const savedMessages = demoChatMessages[threadId] || [];
      setMessages(savedMessages);
      console.log('📝 Restored', savedMessages.length, 'messages for demo chat');
      
      setIsChatLoading(false);
      return;
    }

    // Clear messages for server-side chats
    setMessages([]);

    try {
      const response = await fetch(`/api/chat/${threadId}`);
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
      console.error('🛑 Error fetching messages for chat:', threadId, error);
      setMessages([{ id: 'error-message', role: 'assistant', content: error.message || 'Could not load messages.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteChat = async (threadId: string) => {
    if (activeChatId === threadId) {
      setActiveChatId(null);
      setThreadId(null);
      setMessages([]);
    }
    
    const updatedChats = chats.filter(chat => chat.threadId !== threadId && chat.id !== threadId);
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

    let currentThreadId = activeChatId;

    if (!currentThreadId) {
      const newThreadId = await handleNewChat(message, true);
      if (newThreadId) {
        currentThreadId = newThreadId;
      } else {
        console.error("Failed to create a new chat, message not sent.");
        const errorMessage: Message = { id: `err-${Date.now()}`, role: 'assistant', content: "Sorry, I couldn't start a new chat. Please try again." };
        setMessages([errorMessage]);
        return;
      }
    }

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: message };
    console.log('[handleSendMessage] Adding user message:', userMessage);
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('[handleSendMessage] Updated messages after user:', newMessages);
      
      // Save messages for demo chats
      if (currentThreadId && (currentThreadId.startsWith('demo_') || currentThreadId.startsWith('local_chat_'))) {
        setDemoChatMessages(prev => ({
          ...prev,
          [currentThreadId]: newMessages
        }));
      }
      
      return newMessages;
    });

    let reply = "Assistant is thinking...";
    try {
      const assistantResponse = await invokeAssistant(message, threadId || '');
      reply = assistantResponse.reply;
      console.log("Assistant says:", reply);
      if (assistantResponse.threadId) {
        setThreadId(assistantResponse.threadId);
      }
      
      const assistantMessage: Message = { id: `asst-${Date.now()}`, role: 'assistant', content: reply };
      console.log('[handleSendMessage] Adding assistant message:', assistantMessage);
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        console.log('[handleSendMessage] Updated messages after assistant:', newMessages);
        
        // Save messages for demo chats
        if (currentThreadId && (currentThreadId.startsWith('demo_') || currentThreadId.startsWith('local_chat_'))) {
          setDemoChatMessages(prev => ({
            ...prev,
            [currentThreadId]: newMessages
          }));
        }
        
        return newMessages;
      });

      const chatToUpdate = chats.find(c => c.threadId === currentThreadId || c.id === currentThreadId);
      if (chatToUpdate && !chatToUpdate.threadId && assistantResponse.threadId) {
        // Update thread ID in local state for unauthenticated users
        setChats(prev => prev.map(c => (c.threadId === currentThreadId || c.id === currentThreadId) ? {...c, threadId: assistantResponse.threadId} : c));
      }

    } catch (error) {
      console.error("Error calling assistant:", error);
      reply = "Sorry, I couldn't respond.";
      const errorMessage: Message = { id: `err-${Date.now()}`, role: 'assistant', content: reply };
      console.log('[handleSendMessage] Adding error message:', errorMessage);
      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        console.log('[handleSendMessage] Updated messages after error:', newMessages);
        return newMessages;
      });
    }
    
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => 
        (chat.threadId === currentThreadId || chat.id === currentThreadId) 
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
      // Clear local storage for unauthenticated users
      localStorage.removeItem('local_chats');
      localStorage.removeItem('user_usage');
      window.location.href = '/auth/login';
    }
  };

  const getCurrentChatTitle = () => {
    if (!activeChatId) return undefined;
    const currentChat = chats.find(chat => chat.threadId === activeChatId || chat.id === activeChatId);
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

    // Check if wallet is connected for Solana storage
    const walletConnected = localStorage.getItem('wallet_connected') === 'true';

    if (walletConnected) {
      try {
        // Create chat on Solana
        const response = await fetch('/api/wallet/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newChatTitle,
            lastMessage: initialMessage || 'Start a new conversation...',
            threadId: newThreadId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newChat: Chat = {
            id: data.conversation.id,
            title: data.conversation.title,
            lastMessage: data.conversation.lastMessage,
            timestamp: new Date(data.conversation.updated_at),
            threadId: data.conversation.thread_id,
          };

          const updatedChats = [newChat, ...chats];
          setChats(updatedChats);
          setActiveChatId(newChat.threadId || newChat.id);
          setThreadId(newChat.threadId || newChat.id);

          return newChat.threadId || newChat.id;
        }
      } catch (error) {
        console.error('Failed to create Solana chat:', error);
        // Fall back to local storage
      }
    }

    // Create local chat for unauthenticated users
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
    return tempId;
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
    </div>
  );
}

export default function ConvocorePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <ConvocorePageContent />
    </Suspense>
  )
}
