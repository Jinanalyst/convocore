"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatArea } from "@/components/layout/chat-area";
import { ResizablePanel } from "@/components/ui/resizable-panel";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Resizable Sidebar - Desktop */}
      {!isMobile && !isSidebarCollapsed && (
        <ResizablePanel
          direction="horizontal"
          initialSize={320}
          minSize={240}
          maxSize={600}
          onResize={handleSidebarResize}
          className="border-r border-border bg-card h-full"
        >
          <div className="h-full flex flex-col">
            <Sidebar
              activeChatId={activeChatId || undefined}
              isCollapsed={false}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onToggleCollapse={handleToggleSidebar}
              className="h-full"
            />
          </div>
        </ResizablePanel>
      )}

      {/* Collapsed Sidebar for mobile or when collapsed */}
      {(isMobile || isSidebarCollapsed) && (
        <div className="w-16 border-r border-border bg-card flex-shrink-0 h-full">
          <Sidebar
            activeChatId={activeChatId || undefined}
            isCollapsed={true}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onToggleCollapse={handleToggleSidebar}
            className="h-full"
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <Header 
          className="flex-shrink-0"
        />
        
        {/* Chat Area - Resizable */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
