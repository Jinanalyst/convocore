"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Clock } from 'lucide-react';
import { getRelativeTime } from '@/lib/date-utils';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: Chat[];
  onSelectChat?: (chatId: string) => void;
}

export function SearchModal({ open, onOpenChange, chats = [], onSelectChat }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Chat[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, chats]);

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
    onOpenChange(false);
  };

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Search Conversations
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search your conversations</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    onClick={() => handleSelectChat(chat.id)}
                    className="w-full p-4 h-auto justify-start text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <MessageSquare className="w-5 h-5 mt-1 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {chat.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(chat.timestamp)}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 