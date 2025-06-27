"use client";

import { useRef, useEffect, useState } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { EnhancedChatMessage } from "@/components/ui/enhanced-chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { useLanguage } from '@/lib/language-context';
import { cn } from "@/lib/utils";
import type { Message } from "@/app/convocore/page";
import { ChatLimitIndicator } from '@/components/ui/chat-limit-indicator';
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { ConvoAILogo } from "@/components/ui/convoai-logo";

interface ChatAreaProps {
  className?: string;
  chatId?: string;
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string, model: string, includeWebSearch?: boolean) => void;
  usage: {
    used: number;
    limit: number;
    plan: 'free' | 'pro' | 'premium';
  };
}

export function ChatArea({ 
  className, 
  chatId, 
  messages,
  isLoading = false,
  onSendMessage,
  usage
}: ChatAreaProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('[ChatArea] Messages updated:', {
      count: messages.length,
      messages: messages.map(m => ({ id: m.id, role: m.role, contentLength: m.content.length, contentPreview: m.content.substring(0, 50) }))
    });
  }, [messages]);

  useEffect(() => {
    console.log('[ChatArea] Props updated:', {
      chatId,
      isLoading,
      messagesCount: messages.length,
      usage
    });
  }, [chatId, isLoading, messages.length, usage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adapter function for AIChatInput's onSendMessage
  const handleChatInputSend = (message: string, options?: { think?: boolean; deepSearch?: boolean }) => {
    console.log('[ChatArea] Sending message:', { message, options });
    // We'll use a default model and pass the web search option.
    // The parent `convocore/page.tsx` now handles the actual API call.
    onSendMessage(message, 'gpt-4o', options?.deepSearch);
    setInputValue(""); // Clear input after sending
  };

  const handleSend = (message: string) => {
    if (message.trim()) {
      console.log('[ChatArea] handleSend called:', message);
      onSendMessage(message, "gpt-4o"); // Example model
      setInputValue("");
    }
  };

  const placeholders = [
    t("convocore.placeholder1"),
    t("convocore.placeholder2"),
    t("convocore.placeholder3"),
    t("convocore.placeholder4"),
    t("convocore.placeholder5"),
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                <p className="text-gray-500">{t('chat_area.loading_chat')}</p>
              </div>
            </div>
          ) : messages.length === 0 && !inputValue ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500 py-12">
              {/* Empty state: no logo, no welcome text */}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                console.log('[ChatArea] Rendering message:', { id: message.id, role: message.role, contentLength: message.content.length });
                return (
                  <EnhancedChatMessage
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    role={message.role}
                    timestamp={new Date()} // Placeholder, consider passing real timestamp
                    onCopy={() => navigator.clipboard.writeText(message.content)}
                  />
                );
              })}
              <TypingIndicator isVisible={isLoading} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <ChatLimitIndicator usage={usage} className="mb-4" />
          <AIChatInput
            value={inputValue}
            onChange={setInputValue}
            onSendMessage={handleChatInputSend}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
} 