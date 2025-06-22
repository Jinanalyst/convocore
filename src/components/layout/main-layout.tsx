"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatArea } from "@/components/layout/chat-area";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <Header 
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isSidebarCollapsed 
            ? (isMobile ? "w-0" : "w-16") 
            : "w-80",
          isMobile && isSidebarCollapsed && "hidden"
        )}>
          <Sidebar
            activeChatId={activeChatId}
            isCollapsed={isSidebarCollapsed}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onToggleCollapse={handleToggleSidebar}
            className="h-full"
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatArea
            chatId={activeChatId}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
} 