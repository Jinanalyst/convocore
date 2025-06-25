"use client";

import { useRef, useEffect } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { EnhancedChatMessage } from "@/components/ui/enhanced-chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { useLanguage } from '@/lib/language-context';
import { cn } from "@/lib/utils";
import type { Message } from "@/app/convocore/page";

interface ChatAreaProps {
  className?: string;
  chatId?: string;
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string, model: string, includeWebSearch?: boolean) => void;
}

export function ChatArea({ 
  className, 
  chatId, 
  messages,
  isLoading = false,
  onSendMessage 
}: ChatAreaProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adapter function for AIChatInput's onSendMessage
  const handleChatInputSend = (message: string, options?: { think?: boolean; deepSearch?: boolean }) => {
    // We'll use a default model and pass the web search option.
    // The parent `convocore/page.tsx` now handles the actual API call.
    onSendMessage(message, 'gpt-4o', options?.deepSearch);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <ConvocoreLogo className="w-24 h-24 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{t('convocore.welcome')}</h2>
              <p className="mt-2">{t('convocore.start_conversation')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <EnhancedChatMessage
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={new Date()} // Placeholder, consider passing real timestamp
                  onCopy={() => navigator.clipboard.writeText(message.content)}
                />
              ))}
              <TypingIndicator isVisible={isLoading} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <AIChatInput
            onSendMessage={handleChatInputSend}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
} 