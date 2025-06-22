"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Mic, MicOff, Send, Paperclip, Globe, X } from "lucide-react";
import { ModelSelector } from "@/components/ui/model-selector";
import { cn } from "@/lib/utils";

interface AIInputDemoProps {
  onSubmit?: (message: string, model: string, includeWebSearch?: boolean) => void;
  onFileUpload?: (file: File) => void;
  onVoiceInput?: () => void;
  className?: string;
}

export function AIInputDemo({ 
  onSubmit, 
  onFileUpload, 
  onVoiceInput, 
  className 
}: AIInputDemoProps) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile detection and keyboard handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleResize = () => {
      checkMobile();
      
      // Detect virtual keyboard on mobile
      if (window.innerWidth <= 768) {
        const currentHeight = window.innerHeight;
        const fullHeight = window.screen.height;
        setIsKeyboardOpen(fullHeight - currentHeight > 150);
      }
    };

    checkMobile();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight with limits
    const maxHeight = isMobile ? 120 : 200;
    const minHeight = isMobile ? 44 : 48;
    const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
    
    textarea.style.height = `${newHeight}px`;
  }, [message, isMobile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSubmit?.(message.trim(), selectedModel, includeWebSearch);
    setMessage("");
    setUploadedFile(null);
    setIncludeWebSearch(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onFileUpload?.(file);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    onVoiceInput?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isMobile) {
        // On mobile, Enter should create new line unless explicitly submitted
        return;
      } else {
        // On desktop, Enter submits (unless Shift+Enter)
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Model Selector - Mobile-optimized */}
        <div className={`flex items-center justify-between ${
          isMobile ? 'px-1' : 'px-0'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`font-medium text-gray-700 dark:text-gray-300 ${
              isMobile ? 'text-sm' : 'text-base'
            }`}>
              Model:
            </span>
            <ModelSelector
              value={selectedModel}
              onValueChange={setSelectedModel}
              className={isMobile ? 'text-sm' : ''}
            />
          </div>
          
          {/* Web Search Toggle - Mobile-optimized */}
          <button
            type="button"
            onClick={() => setIncludeWebSearch(!includeWebSearch)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
              ${includeWebSearch 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
              }
              hover:scale-105 active:scale-95 touch-feedback
              ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm'}
            `}
            aria-label={includeWebSearch ? "Disable web search" : "Enable web search"}
          >
            <Globe className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
            {!isMobile && (
              <span className="font-medium">
                {includeWebSearch ? "Web Search On" : "Web Search"}
              </span>
            )}
          </button>
        </div>

        {/* File Upload Preview */}
        {uploadedFile && (
          <div className={`
            flex items-center justify-between bg-gray-100 dark:bg-zinc-800 
            rounded-lg p-3 border border-gray-200 dark:border-zinc-700
            ${isMobile ? 'mx-1' : ''}
          `}>
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className={`text-gray-700 dark:text-gray-300 truncate ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>
                {uploadedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors touch-feedback"
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Main Input Container */}
        <div className={`
          relative bg-white dark:bg-zinc-900 rounded-xl border-2 
          border-gray-200 dark:border-zinc-700 shadow-sm
          focus-within:border-blue-500 focus-within:shadow-md
          transition-all duration-200
          ${isMobile ? 'mx-1' : ''}
          ${isKeyboardOpen ? 'mb-2' : ''}
        `}>
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isMobile 
              ? "Ask me anything..." 
              : "Ask me anything... (Enter to send, Shift+Enter for new line)"
            }
            className={`
              w-full border-none focus:ring-0 focus:outline-none 
              resize-none bg-transparent
              ${isMobile 
                ? 'text-base p-3 min-h-[44px]' 
                : 'text-base p-4 min-h-[48px]'
              }
            `}
            style={{ 
              minHeight: isMobile ? '44px' : '48px',
              maxHeight: isMobile ? '120px' : '200px',
              fontSize: '16px' // Prevent zoom on iOS
            }}
          />

          {/* Bottom Toolbar */}
          <div className={`
            flex items-center justify-between border-t border-gray-200 dark:border-zinc-700
            ${isMobile ? 'p-2' : 'p-3'}
          `}>
            {/* Left Actions */}
            <div className="flex items-center gap-1">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.pdf,.doc,.docx,.json,.csv"
              />
              <Button
                type="button"
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-zinc-800 touch-feedback
                  ${isMobile ? 'px-2 py-1.5 h-8' : 'h-9 w-9'}
                `}
                aria-label="Upload file"
              >
                <Paperclip className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                {isMobile && <span className="ml-1 text-xs">File</span>}
              </Button>

              {/* Voice Input */}
              <Button
                type="button"
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={handleVoiceToggle}
                className={`
                  transition-colors touch-feedback
                  ${isMobile ? 'px-2 py-1.5 h-8' : 'h-9 w-9'}
                  ${isRecording 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }
                `}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                ) : (
                  <Mic className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                )}
                {isMobile && (
                  <span className="ml-1 text-xs">
                    {isRecording ? "Stop" : "Voice"}
                  </span>
                )}
              </Button>
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!message.trim()}
              className={`
                bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                disabled:dark:bg-zinc-700 text-white transition-all duration-200
                hover:scale-105 active:scale-95 touch-feedback
                ${isMobile 
                  ? 'px-4 py-2 h-8 text-sm min-w-[60px]' 
                  : 'px-6 py-2 h-9'
                }
                disabled:hover:scale-100 disabled:cursor-not-allowed
              `}
              aria-label="Send message"
            >
              <Send className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>Send</span>
            </Button>
          </div>
        </div>

        {/* Mobile Keyboard Helper */}
        {isMobile && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tap Send to submit • Voice input available
            </p>
          </div>
        )}
      </form>
    </div>
  );
}