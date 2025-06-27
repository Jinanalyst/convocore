"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatArea } from "@/components/layout/chat-area";
import { ResizablePanel } from "@/components/ui/resizable-panel";
import { FloatingActionButton, ChatFocusMode } from "@/components/ui/floating-action-button";
import { cn } from "@/lib/utils";
import { getDefaultModelForTier } from "@/lib/ai-service";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  messageCount: number;
}

export function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(280);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Mobile detection and responsive sidebar behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
      } else {
        // On desktop, remember user's preference from localStorage
        const savedLeftSidebar = localStorage.getItem('sidebar-collapsed');
        const savedRightSidebar = localStorage.getItem('right-sidebar-collapsed');
        
        if (savedLeftSidebar !== null) {
          setIsSidebarCollapsed(savedLeftSidebar === 'true');
        }
        if (savedRightSidebar !== null) {
          setIsRightSidebarCollapsed(savedRightSidebar === 'true');
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNewChat = async () => {
    try {
      const newId = `chat_${Date.now()}`;
      const newTitle = `New Chat ${new Date().toLocaleDateString()}`;

      const newChat: Chat = {
        id: newId,
        title: newTitle,
        timestamp: new Date(),
        messageCount: 0,
      };

      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newId);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }

    // Close mobile sidebar when creating new chat
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    // Close mobile sidebar when selecting a chat
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
    
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      const newState = !isSidebarCollapsed;
      setIsSidebarCollapsed(newState);
      localStorage.setItem('sidebar-collapsed', newState.toString());
    }
  };

  const handleToggleRightSidebar = () => {
    if (!isMobile) {
      const newState = !isRightSidebarCollapsed;
      setIsRightSidebarCollapsed(newState);
      localStorage.setItem('right-sidebar-collapsed', newState.toString());
    }
  };

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      {/* Sidebar (single, toggleable) */}
      <div className={cn(
        "sidebar-transition",
        isMobile 
          ? "sidebar-mobile"
          : "relative",
        isMobile && showMobileSidebar ? "open" : "",
        !isMobile && isSidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      )}>
        <Sidebar
          activeChatId={activeChatId || undefined}
          isCollapsed={isMobile ? false : isSidebarCollapsed}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onToggleCollapse={handleToggleSidebar}
          chats={chats}
          className="h-full"
        />
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="mobile-sidebar-overlay md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 h-full content-with-sidebar",
        !isMobile && isSidebarCollapsed ? "content-sidebar-collapsed" : "content-sidebar-expanded"
      )}>
        {/* Header */}
        <Header 
          className="flex-shrink-0"
          onToggleSidebar={handleToggleSidebar}
          onToggleRightSidebar={handleToggleRightSidebar}
          showMobileMenu={showMobileSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          isRightSidebarCollapsed={isRightSidebarCollapsed}
          currentChatId={activeChatId || undefined}
          currentChatTitle={activeChatId ? `Chat ${activeChatId.slice(0, 8)}` : undefined}
        />
        {/* Chat Area - Resizable */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            className="h-full"
            messages={[]}
            onSendMessage={(message: string, model: string, includeWebSearch?: boolean) => {
              console.log('Message sent:', { message, model, includeWebSearch });
              // Handle message sending here
            }}
            usage={{
              used: 0,
              limit: 100,
              plan: 'free'
            }}
          />
        </div>
      </div>
    </div>
  );
}
