"use client";

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
];

interface MentionItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'model' | 'agent';
}

interface AIChatInputProps {
  onSendMessage?: (message: string, options?: { think?: boolean; deepSearch?: boolean }) => void;
  onAttachFile?: (file?: File) => void;
  onVoiceInput?: () => void;
  disabled?: boolean;
  className?: string;
}

const AIChatInput = ({
  onSendMessage,
  onAttachFile,
  onVoiceInput,
  disabled = false,
  className = "",
}: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
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
    const mentionMatch = beforeCursor.match(/@(model|aiagent)(\w*)?$/);
    
    if (mentionMatch) {
      const mentionType = mentionMatch[1] === 'model' ? 'model' : 'agent';
      const query = mentionMatch[2] || '';
      const startPos = cursorPos - mentionMatch[0].length;
      
      setShowMentions(true);
      setMentionType(mentionType);
      setMentionQuery(query);
      setMentionStartPos(startPos);
      setSelectedMentionIndex(0);
      setMentionItems(filterMentionItems(mentionType, query));
    } else {
      setShowMentions(false);
      setMentionType(null);
      setMentionQuery("");
    }
  }, [filterMentionItems]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setInputValue(value);
    detectMentions(value, cursorPos);
  };

  // Handle mention selection
  const selectMention = useCallback((item: MentionItem) => {
    if (!inputRef.current) return;
    
    const beforeMention = inputValue.substring(0, mentionStartPos);
    const afterMention = inputValue.substring(inputRef.current.selectionStart || inputValue.length);
    
    const mentionText = item.type === 'model' ? `@model:${item.name}` : item.id;
    const newValue = beforeMention + mentionText + " " + afterMention;
    
    setInputValue(newValue);
    setShowMentions(false);
    
    // Focus and set cursor position after the mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [inputValue, mentionStartPos]);

  useEffect(() => {
    if (isActive || inputValue) return;
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false);
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => {
    if (!disabled) {
      setIsActive(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      console.log('🚀 AIChatInput sending message with options:', {
        message: inputValue.trim(),
        think: thinkActive,
        deepSearch: deepSearchActive
      });
      
      onSendMessage?.(inputValue.trim(), {
        think: thinkActive,
        deepSearch: deepSearchActive,
      });
      setInputValue("");
      setIsActive(false);
      setThinkActive(false);
      setDeepSearchActive(false);
      setShowMentions(false);
    }
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

  return (
    <div className={`w-full flex justify-center items-end text-black dark:text-white ${className}`}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl relative"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{
          overflow: "visible",
          borderRadius: 32,
          background: "white",
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={handleActivate}
      >
        {/* Mention Menu */}
        <AnimatePresence>
          {showMentions && mentionItems.length > 0 && (
            <motion.div
              ref={mentionMenuRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
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
          <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-full bg-white dark:bg-zinc-800 max-w-3xl w-full">
            <button
              className="p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition disabled:opacity-50 shrink-0"
              title="Attach file"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onAttachFile?.();
              }}
              disabled={disabled}
            >
              <Paperclip size={18} className="text-gray-600 dark:text-gray-400 sm:w-5 sm:h-5" />
            </button>

            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                className="flex-1 border-0 outline-0 rounded-md py-2 px-1 sm:px-2 text-sm sm:text-base bg-transparent w-full font-normal text-gray-900 dark:text-white disabled:opacity-50"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
                disabled={disabled}
                placeholder={isActive || inputValue ? "Ask me anything..." : ""}
              />
              <div className="absolute left-1 sm:left-2 top-0 right-0 h-full pointer-events-none flex items-center py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 select-none pointer-events-none text-sm sm:text-base"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                        maxWidth: "calc(100% - 8px)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {PLACEHOLDERS[placeholderIndex]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              className="p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition disabled:opacity-50 shrink-0"
              title="Voice input"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
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
              disabled={disabled || !inputValue.trim()}
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={isActive || inputValue ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
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
