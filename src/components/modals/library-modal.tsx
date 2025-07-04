"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Library, FileText, MessageSquare, Code, Plus, Search, Bookmark, Copy, Eye, EyeOff } from 'lucide-react';
import { safeDate } from '@/lib/date-utils';

interface LibraryItem {
  id: string;
  title: string;
  type: 'prompt' | 'template' | 'conversation';
  description: string;
  content?: string;
  createdAt: Date | string | number;
}

interface LibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: LibraryItem[];
  onUseItem?: (item: LibraryItem) => void;
}

// Default Convocore library items
const defaultLibraryItems: LibraryItem[] = [
  {
    id: 'default-1',
    title: '🧠 Convocore Ideation Prompt',
    type: 'prompt',
    description: 'Generate 5 innovative agent ideas based on the task provided.',
    content: 'You are designing a new AI agent for this task: "{{task}}". Suggest 5 unique features or roles this agent could perform that differentiate it from existing tools.',
    createdAt: new Date()
  },
  {
    id: 'default-2',
    title: '📄 Convocore API Template',
    type: 'template',
    description: 'Summarize API endpoints into easy-to-read docs with example requests.',
    content: 'Given the following API spec, generate concise documentation with curl and JS usage examples. Explain each endpoint simply. \n\nAPI Spec:\n{{api_spec}}',
    createdAt: new Date()
  },
  {
    id: 'default-3',
    title: '🔍 Convocore Debug Assistant',
    type: 'prompt',
    description: 'Diagnose and suggest fixes for the given error message and code.',
    content: 'Analyze the following code and error message. Find the root cause and suggest 2 possible fixes.\n\nError: {{error_message}}\n\nCode:\n```{{code}}```',
    createdAt: new Date()
  },
  {
    id: 'default-4',
    title: '💬 ConvoAgent Role Trainer',
    type: 'template',
    description: 'Define tone, behavior, and logic for a new conversational agent.',
    content: 'Create a role definition for an AI agent named \'{{agent_name}}\'.\n\nContext: {{context}}\nTone: {{tone}}\nAbilities: {{abilities}}\nLimitations: {{limitations}}',
    createdAt: new Date()
  },
  {
    id: 'default-5',
    title: '🎨 Convocore Brand Voice Generator',
    type: 'prompt',
    description: 'Generate a consistent brand voice for product, blog, and UI.',
    content: 'You are branding a product called \'{{product_name}}\'. Generate a tone guide and example phrases for UI labels, emails, and landing page content.',
    createdAt: new Date()
  }
];

export function LibraryModal({ open, onOpenChange, items = [], onUseItem }: LibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'prompt' | 'template' | 'conversation'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(defaultLibraryItems);

  useEffect(() => {
    // Merge provided items with defaults, ensuring defaults are always available
    const mergedItems = [
      ...defaultLibraryItems,
      ...items.filter(item => !defaultLibraryItems.some(defaultItem => defaultItem.id === item.id))
    ];
    setLibraryItems(mergedItems);
  }, [items]);

  // Reset search and filters when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedCategory('all');
      setExpandedItems(new Set());
    }
  }, [open]);

  const filteredItems = libraryItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prompt':
        return <Code className="w-4 h-4" />;
      case 'template':
        return <FileText className="w-4 h-4" />;
      case 'conversation':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prompt':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'template':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'conversation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date | string | number) => {
    const dateObj = safeDate(date);
    const now = new Date();
    
    try {
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleUseItem = (item: LibraryItem) => {
    onUseItem?.(item);
    onOpenChange(false);
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Visual feedback - you could enhance this with a toast notification
      console.log('Content copied to clipboard');
      
      // Simple visual feedback by temporarily changing button text
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Library className="w-5 h-5" />
            Library
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search library items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Items', icon: Library },
              { key: 'prompt', label: 'Prompts', icon: Code },
              { key: 'template', label: 'Templates', icon: FileText },
              { key: 'conversation', label: 'Conversations', icon: MessageSquare },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                onClick={() => setSelectedCategory(key as any)}
                className={`flex items-center gap-2 ${
                  selectedCategory === key 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Library Items */}
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-sm">
                  {searchQuery ? 'Try different keywords' : 'Start building your library by saving prompts and conversations'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        {getTypeIcon(item.type)}
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {item.description}
                    </p>
                    
                    {/* Content Preview */}
                    {item.content && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {expandedItems.has(item.id) ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hide Content
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Show Content
                              </>
                            )}
                          </Button>
                          {expandedItems.has(item.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyContent(item.content!)}
                              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          )}
                        </div>
                        
                        {expandedItems.has(item.id) && (
                          <div className="bg-gray-50 dark:bg-zinc-800 rounded-md p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-zinc-700">
                            {item.content}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDate(item.createdAt)}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleUseItem(item)}
                          className="h-7 px-3 text-xs bg-gray-900 text-white hover:bg-gray-800"
                        >
                          Use Item
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 