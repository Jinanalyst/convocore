"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatArea } from "@/components/layout/chat-area";
import { SettingsModal } from "@/components/modals/settings-modal";
import { cn } from "@/lib/utils";

export default function ConvocorePage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    // In a real app, this would delete the chat from the backend
    console.log("Deleting chat:", chatId);
  };

  const handleSendMessage = (message: string, model: string) => {
    console.log("Sending message:", message, "with model:", model);
    // In a real app, this would send the message to the AI service
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

  const handleLogout = () => {
    console.log("Logging out");
    // In a real app, this would handle logout
  };

  const getCurrentChatTitle = () => {
    if (!activeChatId) return undefined;
    
    // Mock data - in real app this would come from state/context
    const chatTitles: Record<string, string> = {
      "1": "Getting Started with Convocore",
      "2": "TRON Wallet Integration", 
      "3": "Content Creation Tips",
      "4": "API Documentation"
    };
    
    return chatTitles[activeChatId];
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
          activeChatId={activeChatId || undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          currentChatTitle={getCurrentChatTitle()}
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