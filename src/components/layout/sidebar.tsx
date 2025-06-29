"use client";

import { useState, useEffect, useRef } from "react";
import { ConvoAILogo } from "@/components/ui/convoai-logo";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/modals/settings-modal";
import { SearchModal } from "@/components/modals/search-modal";
import { LibraryModal } from "@/components/modals/library-modal";
import { ModelInfoModal } from "@/components/modals/model-info-modal";
import { useLanguage } from "@/lib/language-context";
import { useIsMobile } from "@/lib/mobile-utils";
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
import { Tooltip } from "@/components/ui/tooltip";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isActive?: boolean;
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'prompt' | 'template' | 'conversation';
  description: string;
  content?: string;
  createdAt: Date | string | number;
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
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
          content: "Create a creative writing prompt about {{topic}}",
          createdAt: new Date(),
        },
        {
          id: "lib-2",
          title: "Code Review Template",
          type: "template",
          description: "Structured code review format",
          content: "Review the following code:\n\n```{{code}}```\n\nProvide feedback on:",
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
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper for rendering icon buttons with tooltips in collapsed mode
  const renderIconButton = (icon: React.ReactNode, label: string, onClick: () => void, key: string) => (
    <Tooltip content={label} key={key}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="w-12 h-12 flex items-center justify-center mx-auto my-2"
        aria-label={label}
      >
        {icon}
      </Button>
    </Tooltip>
  );

  // Desktop/collapsible sidebar classes
  const sidebarWidth = isCollapsed ? 'md:w-[60px]' : 'md:w-[280px]';
  const sidebarBase = 'flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-300 ease-in-out';

  return (
    <>
      <div className={cn(
        sidebarBase,
        sidebarWidth,
        className
      )}>
        {/* Header: Logo + Toggle (clean, single row, no duplicate text) */}
        <div className="flex items-center p-4 border-b border-gray-100 dark:border-zinc-800 gap-2">
          {isCollapsed ? (
            <span className="block flex items-center justify-center w-full overflow-hidden">
              <ConvoAILogo className="w-8 h-8" />
            </span>
          ) : (
            <ConvoAILogo className="w-full" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="ml-1 hidden md:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Main Content: flex-1 vertical layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* New Chat Button */}
          <div className={cn(
            isCollapsed ? "flex flex-col items-center w-full mt-2" : "p-4 flex-shrink-0"
          )}>
            {isCollapsed ? (
              <Tooltip content="New Conversation">
                <Button
                  onClick={handleNewChat}
                  className="bg-black dark:bg-white text-white dark:text-black rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 shadow-md"
                  aria-label="New Conversation"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </Tooltip>
            ) : (
              <Button
                onClick={handleNewChat}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 justify-start gap-2 h-12 rounded-xl shadow-md text-base font-semibold"
              >
                <Plus className="w-5 h-5" />
                New Conversation
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            isCollapsed ? "flex flex-col items-center w-full" : "px-4 pb-4"
          )}>
            {isCollapsed ? (
              <>
                {renderIconButton(<Settings className="w-5 h-5" />, "Settings", handleSettings, "settings")}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSearch}
                  className="w-full flex items-center gap-2 text-base justify-start h-12 rounded-xl"
                >
                  <Search className="w-5 h-5" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLibrary}
                  className="w-full flex items-center gap-2 text-base justify-start h-12 rounded-xl"
                >
                  <Archive className="w-5 h-5" />
                  Library
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleModelInfo}
                  className="w-full flex items-center gap-2 text-base justify-start h-12 rounded-xl"
                >
                  <HelpCircle className="w-5 h-5" />
                  Models
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 text-base justify-start h-12 rounded-xl"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Button>
              </div>
            )}
          </div>

          {/* Recent Chats */}
          <div className={cn(
            'flex-1 w-full flex flex-col min-h-0',
            isCollapsed ? 'items-center' : ''
          )}>
            {!isCollapsed && (
              <div className="px-4 pb-2 flex-shrink-0">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Chats
                </h3>
              </div>
            )}
            <div className={cn(
              'flex-1 min-h-0 overflow-hidden w-full',
              isCollapsed ? 'items-center' : ''
            )}>
              <div className="h-full bg-gray-50/80 dark:bg-zinc-800/80 rounded-2xl border border-gray-300 dark:border-zinc-600 shadow-sm overflow-y-auto w-full flex flex-col">
                {isLoading ? (
                  <div className="space-y-2 w-full p-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'animate-pulse bg-gray-200 dark:bg-zinc-600 rounded-lg',
                          isCollapsed ? 'h-8 w-8 mx-auto' : 'h-12'
                        )}
                      />
                    ))}
                  </div>
                ) : filteredChats.length === 0 ? (
                  !isCollapsed && (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No chats yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new conversation</p>
                    </div>
                  )
                ) : (
                  <div className={cn('space-y-1 w-full p-2', isCollapsed ? 'flex flex-col items-center' : '')}>
                    {filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={cn(
                          'group relative rounded-lg transition-all duration-300 border',
                          chat.id === activeChatId
                            ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600'
                            : 'bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500',
                          isCollapsed ? 'w-10 h-10 flex items-center justify-center mx-auto' : ''
                        )}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                      >
                        <div
                          onClick={() => handleChatSelect(chat.id)}
                          className={cn(
                            'w-full text-left transition-all duration-300 cursor-pointer',
                            isCollapsed ? 'flex items-center justify-center h-10' : 'p-3'
                          )}
                          title={isCollapsed ? chat.title : undefined}
                        >
                          {isCollapsed ? (
                            <Tooltip content={chat.title}>
                              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto" />
                            </Tooltip>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{chat.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{chat.lastMessage}</p>
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                                {formatSidebarTimestamp(chat.timestamp)}
                              </span>
                            </div>
                          )}
                        </div>
                        {!isCollapsed && hoveredChatId === chat.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-zinc-900 py-1 px-1 rounded-md shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleChatAction(e, 'delete', chat.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
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
          onSelectChat={onSelectChat}
        />
        <LibraryModal
          open={showLibraryModal}
          onOpenChange={setShowLibraryModal}
          items={libraryItems}
          onUseItem={onUseLibraryItem}
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
    </>
  );
}
