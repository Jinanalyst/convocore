"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatArea } from "@/components/layout/chat-area";
import { ResizablePanel } from "@/components/ui/resizable-panel";
import { cn } from "@/lib/utils";
import { chatStorageService, type Chat } from "@/lib/chat-storage-service";
import { chatMigrationService } from "@/lib/chat-migration-service";

export function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migrationInfo, setMigrationInfo] = useState<{ sessionCount: number; messageCount: number }>({ sessionCount: 0, messageCount: 0 });
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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

  // Load chat sessions using the chat storage service
  useEffect(() => {
    const loadChats = async () => {
      try {
        const sessions = await chatStorageService.loadChatSessions();
        const formattedChats = chatStorageService.sessionsToChats(sessions);
        setChats(formattedChats);
      } catch (error) {
        console.error('Failed to load chats for sidebar:', error);
      }
    };

    // Load chats on mount
    loadChats();

    // Check for migration needs
    const checkMigration = async () => {
      try {
        const shouldMigrate = await chatMigrationService.shouldPromptMigration();
        if (shouldMigrate) {
          const info = await chatMigrationService.getMigrationInfo();
          setMigrationInfo(info);
          setShowMigrationPrompt(true);
        }
      } catch (error) {
        console.error('Failed to check migration needs:', error);
      }
    };

    checkMigration();

    // Listen for storage changes to update sidebar when chats are modified
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'convocore-chat-sessions') {
        loadChats();
      }
    };

    // Also listen for custom events from chat components
    const handleChatUpdate = () => {
      loadChats();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chat-sessions-updated', handleChatUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chat-sessions-updated', handleChatUpdate);
    };
  }, []);

  const handleNewChat = () => {
    setActiveChatId(null);
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
    // TODO: Load the selected chat session data and pass it to the chat area
    // This will require updating the ChatArea component to accept session data
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatStorageService.deleteChatSession(chatId);
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
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  const handleMigration = async () => {
    try {
      setShowMigrationPrompt(false);
      const result = await chatMigrationService.migrateLocalDataToDatabase();
      
      if (result.success) {
        console.log(`Successfully migrated ${result.migratedCount} chat sessions to database`);
        // Reload chats from database
        const sessions = await chatStorageService.loadChatSessions();
        const formattedChats = chatStorageService.sessionsToChats(sessions);
        setChats(formattedChats);
      } else {
        console.error('Migration failed:', result.error);
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  };

  const handleSkipMigration = () => {
    setShowMigrationPrompt(false);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      {/* Desktop Resizable Sidebar */}
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
              chats={chats}
              className="h-full"
            />
          </div>
        </ResizablePanel>
      )}

      {/* Desktop Collapsed Sidebar */}
      {!isMobile && isSidebarCollapsed && (
        <div className="w-16 border-r border-border bg-card flex-shrink-0 h-full">
          <Sidebar
            activeChatId={activeChatId || undefined}
            isCollapsed={true}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onToggleCollapse={handleToggleSidebar}
            chats={chats}
            className="h-full"
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-in fade-in-0 duration-300"
            onClick={() => setShowMobileSidebar(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border z-50 animate-in slide-in-from-left-full duration-300 ease-out">
            <Sidebar
              activeChatId={activeChatId || undefined}
              isCollapsed={false}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onToggleCollapse={handleToggleSidebar}
              chats={chats}
              className="h-full"
            />
          </div>
        </>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <Header 
          className="flex-shrink-0"
          onToggleSidebar={handleToggleSidebar}
          showMobileMenu={showMobileSidebar}
        />
        
        {/* Chat Area - Resizable */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatArea
            chatId={activeChatId || undefined}
            className="h-full"
          />
        </div>
      </div>

      {/* Migration Prompt */}
      {showMigrationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-3">Migrate Your Chat History</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We found {migrationInfo.sessionCount} chat sessions with {migrationInfo.messageCount} messages 
              stored locally. Would you like to migrate them to your cloud account so they're 
              saved across all your devices?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMigration}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Migrate Chats
              </button>
              <button
                onClick={handleSkipMigration}
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-zinc-500 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
