﻿"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send, Bot, Cpu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const PLACEHOLDERS = [
  "Try @model or @aiagent for suggestions",
  "Generate website with HextaUI",
  "Create a new project with Next.js",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "How to cook a delicious meal?",
  "Summarize this article",
];

// Available models
const MODELS = [
  { id: "gpt-4o", name: "Convocore Omni", icon: "🚀", description: "Flagship multimodal model" },
  { id: "gpt-4-turbo", name: "Convocore Turbo", icon: "⚡", description: "High-speed performance" },
  { id: "claude-3-opus-20240229", name: "Convocore Alpha", icon: "🧠", description: "Advanced reasoning" },
  { id: "claude-3-sonnet-20240229", name: "Convocore Nova", icon: "⭐", description: "Balanced performance" },
  { id: "deepseek/deepseek-r1:free", name: "ConvoMini", icon: "🤏", description: "Compact and efficient" },
  { id: "convoart", name: "ConvoArt", icon: "🎨", description: "AI-powered image generation" },
  { id: "convoq", name: "ConvoQ", icon: "⚡", description: "Ultra-fast AI responses" },
];

// Available AI agents
const AI_AGENTS = [
  { tag: "@codegen", name: "Code Builder", icon: "💻", description: "Generate complete code solutions" },
  { tag: "@debugger", name: "Bug Finder", icon: "🐛", description: "Analyze and fix code errors" },
  { tag: "@uiwizard", name: "UI Designer", icon: "🎨", description: "Design beautiful UI components" },
  { tag: "@imagegen", name: "Visionary", icon: "🖼️", description: "Generate image prompts" },
  { tag: "@writer", name: "Copy Master", icon: "✍️", description: "Create compelling content" },
  { tag: "@analyst", name: "Data Analyst", icon: "📊", description: "Analyze data patterns" },
  { tag: "@consultant", name: "Strategy Advisor", icon: "💼", description: "Business strategy guidance" },
  { tag: "@calculator", name: "Math Helper", icon: "🔢", description: "Mathematical calculations" },
  { tag: "@chainscope", name: "Chain Scope", icon: "📈", description: "Analyze crypto tokens and blockchain data" },
];

interface MentionItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'model' | 'agent';
}

interface AIChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage?: (message: string, options?: { think?: boolean; deepSearch?: boolean }) => void;
  onAttachFile?: (file?: File) => void;
  onVoiceInput?: () => void;
  disabled?: boolean;
  className?: string;
}

const AIChatInput = ({
  value,
  onChange,
  onSendMessage,
  onAttachFile,
  onVoiceInput,
  disabled = false,
  className = "",
}: AIChatInputProps) => {
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mention functionality
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionType, setMentionType] = useState<'model' | 'agent' | null>(null);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionItems, setMentionItems] = useState<MentionItem[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter mention items based on query
  const filterMentionItems = useCallback((type: 'model' | 'agent', query: string) => {
    const items = type === 'model' ? 
      MODELS.map(m => ({ id: m.id, name: m.name, icon: m.icon, description: m.description, type: 'model' as const })) :
      AI_AGENTS.map(a => ({ id: a.tag, name: a.name, icon: a.icon, description: a.description, type: 'agent' as const }));
    
    if (!query) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  // Detect @ mentions in input
  const detectMentions = useCallback((value: string, cursorPos: number) => {
    const beforeCursor = value.substring(0, cursorPos);
    
    // More flexible matching - detect @ followed by partial words
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const startPos = cursorPos - mentionMatch[0].length;
      
      console.log('🔍 Mention detected:', { 
        query, 
        startPos, 
        beforeCursor,
        fullMatch: mentionMatch[0],
        queryLength: query.length 
      });
      
      // Determine type based on what user is typing
      let mentionType: 'model' | 'agent' | null = null;
      
      // Show both models and agents when just typing @
      if (query === '') {
        mentionType = 'model'; // Start with models, user can type more to get agents
      }
      // Check for explicit model keywords
      else if ('model'.startsWith(query) || 'models'.startsWith(query)) {
        mentionType = 'model';
      }
      // Check for explicit agent keywords
      else if ('aiagent'.startsWith(query) || 'agent'.startsWith(query) || query === 'ai') {
        mentionType = 'agent';
      }
      // Check for specific agent tags (like @codegen, @debugger, etc.)
      else if (query.startsWith('code') || query.startsWith('debug') || query.startsWith('ui') || 
               query.startsWith('image') || query.startsWith('write') || query.startsWith('analys') ||
               query.startsWith('consul') || query.startsWith('calc') || query.startsWith('seo') ||
               query.startsWith('deploy') || query.startsWith('chat') || query.startsWith('db') ||
               query.startsWith('chain') || query.startsWith('crypto') || query.startsWith('block')) {
        mentionType = 'agent';
      }
      else {
        // Check if query matches any model or agent names
        const modelMatches = MODELS.some(m => 
          m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
        );
        const agentMatches = AI_AGENTS.some(a => 
          a.name.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query.replace('@', ''))
        );
        
        if (modelMatches && !agentMatches) {
          mentionType = 'model';
        } else if (agentMatches && !modelMatches) {
          mentionType = 'agent';
        } else if (agentMatches || modelMatches) {
          // If both match, prefer agents since they're more specific
          mentionType = 'agent';
        } else if (query.length > 0) {
          // For unrecognized queries, try agents first
          mentionType = 'agent';
        }
      }
      
      if (mentionType) {
        const filteredItems = filterMentionItems(mentionType, query);
        console.log('✅ Showing mentions:', { 
          type: mentionType, 
          count: filteredItems.length,
          query,
          detectionReason: mentionType === 'agent' ? 'Agent keywords/tags detected' : 'Model keywords detected'
        });
        
        setShowMentions(true);
        setMentionType(mentionType);
        setMentionQuery(query);
        setMentionStartPos(startPos);
        setSelectedMentionIndex(0);
        setMentionItems(filteredItems);
      } else {
        setShowMentions(false);
        setMentionType(null);
        setMentionQuery("");
      }
    } else {
      setShowMentions(false);
      setMentionType(null);
      setMentionQuery("");
    }
  }, [filterMentionItems]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || value.length;
    
    console.log('📝 Input changed:', { value, cursorPos, lastChar: value[cursorPos - 1] });
    
    onChange(value);
    detectMentions(value, cursorPos);
  };

  // Handle mention selection
  const selectMention = useCallback((item: MentionItem) => {
    if (!inputRef.current) return;
    
    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(inputRef.current.selectionStart || value.length);
    
    const mentionText = item.type === 'model' ? `@model:${item.name}` : item.id;
    const newValue = beforeMention + mentionText + " " + afterMention;
    
    onChange(newValue);
    setShowMentions(false);
    
    // Focus and set cursor position after the mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionStartPos, onChange]);

  useEffect(() => {
    if (isActive || value) return;

    const interval = setInterval(() => {
      const newIndex = (PLACEHOLDERS.indexOf(placeholder) + 1) % PLACEHOLDERS.length;
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholder(PLACEHOLDERS[newIndex]);
        setShowPlaceholder(true);
      }, 500); // fade out duration
    }, 4000); // stay duration

    return () => clearInterval(interval);
  }, [isActive, value, placeholder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!value) setIsActive(false);
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleActivate = () => {
    if (disabled) return;
    setIsActive(true);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (disabled || !value.trim()) return;
    
    if (onSendMessage) {
      onSendMessage(value, {
        think: thinkActive,
        deepSearch: deepSearchActive,
      });
    }

    onChange("");
    setThinkActive(false);
    setDeepSearchActive(false);
    setShowMentions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentions && mentionItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < mentionItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectMention(mentionItems[selectedMentionIndex]);
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
    
    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  };

  // Only show AI agent selection and features if usage.plan is 'pro' or 'premium'. Hide or disable for 'free'.

  return (
    <div className={`w-full flex justify-center items-end text-black dark:text-white ${className}`}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl relative"
        variants={containerVariants}
        animate={isActive || value ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{
          overflow: "visible",
          borderRadius: 32,
          background: "white",
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={handleActivate}
      >
        {/* Debug indicator - hidden for production */}

        {/* Mention Menu */}
        <AnimatePresence>
          {showMentions && mentionItems.length > 0 && (
            <motion.div
              ref={mentionMenuRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-[60] shadow-2xl"
              style={{ minHeight: '100px' }}
            >
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-700">
                  {mentionType === 'model' ? (
                    <>
                      <Cpu className="w-4 h-4" />
                      Models
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      AI Agents
                    </>
                  )}
                  <span className="text-xs">({mentionItems.length})</span>
                </div>
                {mentionItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => selectMention(item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-zinc-700 ${
                      index === selectedMentionIndex 
                        ? "bg-gray-100 dark:bg-zinc-700" 
                        : ""
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-stretch w-full h-full dark:bg-zinc-800 rounded-[32px]">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.png,.jpg,.jpeg,.gif,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onAttachFile?.(file);
              }
            }}
          />
          
          <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-full bg-white dark:bg-zinc-800 max-w-3xl w-full">
            <button
              className={`
                p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 
                transition disabled:opacity-50 shrink-0 touch-manipulation
                ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''}
              `}
              title="Attach file"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled}
            >
              <Paperclip size={18} className="text-gray-600 dark:text-gray-400 sm:w-5 sm:h-5" />
            </button>

            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsActive(true)}
                placeholder={isActive || value ? "Ask me anything..." : " "}
                className="w-full text-lg p-4 rounded-xl md:text-base md:p-2 bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-800 dark:text-gray-200 disabled:opacity-50 truncate"
                disabled={disabled}
              />
              <div className="absolute left-1 sm:left-2 top-0 right-0 h-full pointer-events-none flex items-center py-2">
                {!isActive && !value && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 select-none pointer-events-none text-sm sm:text-base transition-opacity duration-500 ${showPlaceholder ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      paddingLeft: '1rem',
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      zIndex: 0,
                      maxWidth: "calc(100% - 8rem)",
                    }}
                  >
                    {placeholder}
                  </span>
                )}
              </div>
            </div>

            <button
              className={`
                p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 
                transition disabled:opacity-50 shrink-0 touch-manipulation
                ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''}
              `}
              title="Voice input"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVoiceInput?.();
              }}
              disabled={disabled}
            >
              <Mic size={18} className="text-gray-600 dark:text-gray-400 sm:w-5 sm:h-5" />
            </button>
            <button
              className="flex items-center gap-1 bg-black hover:bg-zinc-700 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black p-2 sm:p-3 rounded-full font-medium justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Send"
              type="button"
              tabIndex={-1}
              onClick={handleSend}
              disabled={disabled || !value.trim()}
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={isActive || value ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            style={{ marginTop: 8 }}
          >
            <div className="flex gap-3 items-center">
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group disabled:opacity-50 ${
                  thinkActive
                    ? "bg-blue-600/10 outline outline-blue-600/60 text-blue-950 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600"
                }`}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
                disabled={disabled}
              >
                <Lightbulb className="group-hover:fill-yellow-300 transition-all" size={18} />
                Think
              </button>

              <button
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start disabled:opacity-50 ${
                  deepSearchActive
                    ? "bg-blue-600/10 outline outline-blue-600/60 text-blue-950 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600"
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                disabled={disabled}
              >
                <Globe size={18} />
                {deepSearchActive && <span className="ml-1">Deep Search</span>}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export { AIChatInput };
