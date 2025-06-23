"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const PLACEHOLDERS = [
  "Generate website with HextaUI",
  "Create a new project with Next.js",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "How to cook a delicious meal?",
  "Summarize this article",
];

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onSendMessage?.(inputValue.trim(), {
        think: thinkActive,
        deepSearch: deepSearchActive,
      });
      setInputValue("");
      setIsActive(false);
      setThinkActive(false);
      setDeepSearchActive(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
        className="w-full max-w-3xl"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{
          overflow: "hidden",
          borderRadius: 32,
          background: "white",
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={handleActivate}
      >
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
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
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
