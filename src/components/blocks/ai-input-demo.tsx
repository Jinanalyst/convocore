"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Search, 
  Bot
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AIInputDemoProps {
  onSubmit?: (message: string, model: string, includeWebSearch?: boolean) => void;
  onFileUpload?: (file: File) => void;
  onVoiceInput?: () => void;
  placeholder?: string;
  className?: string;
}

export function AIInputDemo({ 
  onSubmit, 
  onFileUpload, 
  onVoiceInput, 
  placeholder = "What would you like to know?",
  className 
}: AIInputDemoProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = [
    { id: 'gpt-4o', name: 'Convocore Omni', description: 'Flagship model, multimodal, high performance' },
    { id: 'gpt-4-turbo', name: 'Convocore Turbo', description: 'Fast response + high quality, code/text optimized' },
    { id: 'claude-3-opus-20240229', name: 'Convocore Alpha', description: 'Most precise reasoning, long-form writing' },
    { id: 'claude-3-sonnet-20240229', name: 'Convocore Nova', description: 'Balanced performance, fast response' },
  ];

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of ~4 lines
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSubmit) {
      onSubmit(message.trim(), selectedModel, includeWebSearch);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    onVoiceInput?.();
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Model Selection - Mobile Responsive */}
      <div className="mb-3 sm:mb-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full sm:w-auto sm:max-w-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Select AI Model" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white focus-within:border-transparent transition-all duration-200">
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[48px] sm:min-h-[56px] max-h-[120px] resize-none border-0 bg-transparent px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ height: 'auto' }}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 dark:border-zinc-700">
            {/* Left Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Voice Input */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 p-0 transition-colors",
                  isRecording 
                    ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <Mic className="w-4 h-4" />
              </Button>

              {/* Web Search Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIncludeWebSearch(!includeWebSearch)}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 p-0 transition-colors",
                  includeWebSearch 
                    ? "text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                title={includeWebSearch ? "Disable web search" : "Enable web search"}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Keyboard Shortcut Hint - Hidden on mobile */}
              <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
                {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Enter
              </span>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!message.trim()}
                className={cn(
                  "h-8 sm:h-9 px-3 sm:px-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                  message.trim() && "shadow-sm hover:shadow-md"
                )}
              >
                <Send className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        {(includeWebSearch || isRecording) && (
          <div className="flex items-center gap-2 mt-2 px-1">
            {includeWebSearch && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Search className="w-3 h-3" />
                <span>Web search enabled</span>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording...</span>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
} 