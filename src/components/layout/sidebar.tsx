"use client";

import { useState } from "react";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Library, 
  Settings, 
  Trash2,
  Edit3,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive?: boolean;
}

interface SidebarProps {
  className?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  activeChatId?: string;
}

export function Sidebar({ 
  className, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  activeChatId 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  // Mock chat data - in real app this would come from props or context
  const [chats] = useState<Chat[]>([
    {
      id: "1",
      title: "Getting Started with Convocore",
      lastMessage: "How do I use the AI model settings?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2", 
      title: "TRON Wallet Integration",
      lastMessage: "Help me connect my TRON wallet for payments",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      title: "Content Creation Tips",
      lastMessage: "What are the best practices for writing prompts?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: "4",
      title: "API Documentation",
      lastMessage: "How do I integrate the Convocore API?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
  ]);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleChatAction = (e: React.MouseEvent, action: 'edit' | 'delete', chatId: string) => {
    e.stopPropagation();
    if (action === 'delete') {
      onDeleteChat?.(chatId);
    }
    // Edit functionality can be added later
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800",
      className
    )}>
      {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
        <ConvocoreLogo size="lg" />
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="px-4 pb-4 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300">
          <Search className="w-4 h-4" />
          Search
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300">
          <Library className="w-4 h-4" />
          Library
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300">
          <Settings className="w-4 h-4" />
          Convocore Model
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            Recent Chats
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2">
          {filteredChats.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? "No chats found" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                    activeChatId === chat.id 
                      ? "bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700" 
                      : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                  )}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium text-sm truncate",
                        activeChatId === chat.id 
                          ? "text-gray-900 dark:text-white" 
                          : "text-gray-900 dark:text-white"
                      )}>
                        {chat.title}
                      </h4>
                      <p className={cn(
                        "text-xs truncate mt-1",
                        activeChatId === chat.id 
                          ? "text-gray-600 dark:text-gray-300" 
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {chat.lastMessage}
                      </p>
                      <span className={cn(
                        "text-xs mt-1 block",
                        activeChatId === chat.id 
                          ? "text-gray-600 dark:text-gray-400" 
                          : "text-gray-400 dark:text-gray-500"
                      )}>
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    {(hoveredChatId === chat.id || activeChatId === chat.id) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-zinc-700"
                          onClick={(e) => handleChatAction(e, 'edit', chat.id)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                          onClick={(e) => handleChatAction(e, 'delete', chat.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
              <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  );
} 