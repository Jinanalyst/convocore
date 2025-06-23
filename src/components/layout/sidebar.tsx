"use client";

import { useState, useEffect, useRef } from "react";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/settings-modal";
import { SearchModal } from "@/components/modals/search-modal";
import { LibraryModal } from "@/components/modals/library-modal";
import { ModelInfoModal } from "@/components/modals/model-info-modal";
import { useLanguage } from "@/lib/language-context";
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Library, 
  Settings, 
  Trash2,
  Edit3,
  MoreHorizontal,
  Bot,
  BookOpen,
  History,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  HelpCircle,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSidebarTimestamp } from "@/lib/date-utils";

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
  onUseLibraryItem?: (item: LibraryItem) => void;
  activeChatId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  chats?: Chat[];
}

interface LibraryItem {
  id: string;
  title: string;
  type: "prompt" | "conversation" | "template";
  description: string;
  content?: string;
  createdAt: Date;
}

interface ModelInfo {
  name: string;
  description: string;
  capabilities: string[];
  contextLength: number;
  pricing: string;
}

export function Sidebar({ 
  className, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onUseLibraryItem,
  activeChatId,
  isCollapsed = false,
  onToggleCollapse,
  chats = []
}: SidebarProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real chat data from Supabase
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadLibraryItems();
  }, []);

  const loadLibraryItems = async () => {
    try {
      // Demo library items
      const demoItems: LibraryItem[] = [
        {
          id: "lib-1",
          title: "Creative Writing Prompt",
          type: "prompt",
          description: "Generate creative writing ideas",
          createdAt: new Date(),
        },
        {
          id: "lib-2",
          title: "Code Review Template",
          type: "template",
          description: "Structured code review format",
          createdAt: new Date(),
        },
      ];

      setLibraryItems(demoItems);
    } catch (error) {
      console.error("Error loading library items:", error);
    }
  };

  const handleChatAction = async (e: React.MouseEvent, action: "edit" | "delete", chatId: string) => {
    e.stopPropagation();
    if (action === "delete") {
      onDeleteChat?.(chatId);
    }
  };

  const handleNewChat = async () => {
    onNewChat?.();
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const handleLibrary = () => {
    setShowLibraryModal(true);
  };

  const handleModelInfo = () => {
    setShowModelModal(true);
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleChatSelect = (chatId: string) => {
    onSelectChat?.(chatId);
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-zinc-900", className)}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0",
        isCollapsed && "justify-center px-2"
      )}>
        {!isCollapsed ? (
          <ConvocoreLogo />
        ) : (
          <ConvocoreLogo size="sm" showText={false} />
        )}
        
        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "shrink-0",
              isCollapsed && "absolute top-3 right-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className={cn("p-3 flex-shrink-0", isCollapsed && "px-2")}>
        <Button
          onClick={handleNewChat}
          className={cn(
            "w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors",
            isCollapsed ? "px-0 justify-center" : "justify-start gap-2"
          )}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && t('chat.newConversation')}
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0">
        {!isCollapsed ? (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
                className="text-xs justify-start"
              >
                <Search className="w-3 h-3 mr-1" />
                Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLibrary}
                className="text-xs justify-start"
              >
                <Archive className="w-3 h-3 mr-1" />
                Library
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModelInfo}
                className="text-xs justify-start"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Models
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettings}
                className="text-xs justify-start"
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-2 pb-3 grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              className="w-full h-6"
              title="Search"
            >
              <Search className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLibrary}
              className="w-full h-6"
              title="Library"
            >
              <Archive className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleModelInfo}
              className="w-full h-6"
              title="Models"
            >
              <HelpCircle className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="w-full h-6"
              title="Settings"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Recent Chats */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Section Header */}
        {!isCollapsed && (
          <div className="px-3 pb-2 flex-shrink-0">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Chats
            </h3>
          </div>
        )}
        
        {/* Chat List Container */}
        <div className={cn(
          "flex-1 min-h-0 overflow-hidden",
          isCollapsed ? "mx-2 mb-2" : "mx-3 mb-3"
        )}>
          <div className="h-full bg-gray-50/80 dark:bg-zinc-800/80 rounded-xl border border-gray-300 dark:border-zinc-600 shadow-sm overflow-hidden">
            <div className="h-full overflow-y-auto p-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "animate-pulse bg-gray-200 dark:bg-zinc-600 rounded-lg",
                        isCollapsed ? "h-8 w-8 mx-auto" : "h-12"
                      )} 
                    />
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                !isCollapsed && (
                  <div className="text-center py-6 px-2">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-zinc-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No chats yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a conversation</p>
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group relative rounded-lg transition-all duration-200 border",
                        chat.id === activeChatId
                          ? "bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600"
                          : "bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500"
                      )}
                      onMouseEnter={() => setHoveredChatId(chat.id)}
                      onMouseLeave={() => setHoveredChatId(null)}
                    >
                      <div
                        onClick={() => handleChatSelect(chat.id)}
                        className={cn(
                          "w-full text-left transition-all duration-200 cursor-pointer",
                          isCollapsed ? "p-2 flex justify-center" : "p-3"
                        )}
                        title={isCollapsed ? chat.title : undefined}
                      >
                        {isCollapsed ? (
                          <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {chat.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {chat.lastMessage}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {formatSidebarTimestamp(chat.timestamp)}
                              </p>
                            </div>
                            
                            {hoveredChatId === chat.id && (
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={(e) => handleChatAction(e, "edit", chat.id)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit chat"
                                >
                                  <Edit3 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={(e) => handleChatAction(e, "delete", chat.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SearchModal 
        open={showSearchModal} 
        onOpenChange={setShowSearchModal}
        chats={chats}
        onSelectChat={handleChatSelect}
      />
      <LibraryModal 
        open={showLibraryModal} 
        onOpenChange={setShowLibraryModal}
        items={libraryItems}
        onUseItem={(item) => {
          const normalizedItem: LibraryItem = {
            ...item,
            createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
          };
          onUseLibraryItem?.(normalizedItem);
          setShowLibraryModal(false);
        }}
      />
      <ModelInfoModal 
        open={showModelModal} 
        onOpenChange={setShowModelModal}
      />
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
}
