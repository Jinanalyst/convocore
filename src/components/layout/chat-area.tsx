"use client";

import { useState, useRef, useEffect } from "react";
import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  User,
  Bot,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatAreaProps {
  className?: string;
  chatId?: string;
  onSendMessage?: (message: string, model: string) => void;
}

export function ChatArea({ className, chatId, onSendMessage }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demo
  useEffect(() => {
    if (chatId) {
      // In a real app, fetch messages for the specific chat
      setMessages([
        {
          id: "1",
          content: "Hello! I'm Convocore, your AI assistant. How can I help you today?",
          role: "assistant",
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        },
        {
          id: "2", 
          content: "Can you help me understand how to use the TRON wallet integration for payments?",
          role: "user",
          timestamp: new Date(Date.now() - 1000 * 60 * 4)
        },
        {
          id: "3",
          content: "Absolutely! The TRON wallet integration allows you to make payments using USDT on the TRON network. Here's how it works:\n\n1. **Connect your wallet**: Click on the wallet icon in your profile dropdown\n2. **Verify balance**: Ensure you have sufficient USDT for your subscription\n3. **Subscribe**: Choose your plan (Pro $20/month or Premium $40/month)\n4. **Automated payments**: Smart contracts handle monthly renewals automatically\n\nThe integration supports TronLink and other popular TRON wallets. Would you like me to walk you through connecting your wallet?",
          role: "assistant", 
          timestamp: new Date(Date.now() - 1000 * 60 * 3)
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, model: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          temperature: 0.7,
          maxTokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API keys in the .env.local file and try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    onSendMessage?.(content, model);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification in real app
  };

  const handleRegenerateResponse = (messageId: string) => {
    // Find the message and regenerate the AI response
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: "This is a regenerated response with different content." }
          : msg
      ));
      setIsLoading(false);
    }, 1500);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatId && messages.length === 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl px-6">
            <ConvocoreLogo size="lg" className="justify-center mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Convocore
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Your intelligent conversational AI platform. Start a conversation, explore our library, 
              or configure your AI model settings.
            </p>
            
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                 <Sparkles className="w-8 h-8 text-gray-700 dark:text-gray-300 mb-3 mx-auto" />
                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Conversations</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                   Engage with advanced AI models for natural, intelligent conversations
                 </p>
               </div>
               
               <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                 <Bot className="w-8 h-8 text-gray-700 dark:text-gray-300 mb-3 mx-auto" />
                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Custom AI Agents</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                   Create and configure specialized AI agents for specific tasks
                 </p>
               </div>
               
               <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                 <Copy className="w-8 h-8 text-gray-700 dark:text-gray-300 mb-3 mx-auto" />
                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prompt Library</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                   Access a curated collection of prompts and templates
                 </p>
               </div>
             </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
          <AIInputDemo
            placeholder="Type your message to start a conversation..."
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 max-w-4xl",
              message.role === 'user' ? "ml-auto" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                             message.role === 'user' 
                 ? "bg-gray-900 dark:bg-white order-2" 
                 : "bg-gray-100 dark:bg-zinc-900"
            )}>
                             {message.role === 'user' ? (
                 <User className="w-4 h-4 text-white dark:text-gray-900" />
               ) : (
                 <ConvocoreLogo showText={false} size="sm" />
               )}
            </div>

            {/* Message Content */}
            <div className={cn(
              "flex-1 space-y-2",
              message.role === 'user' ? "order-1" : ""
            )}>
                             <div className={cn(
                 "p-4 rounded-lg",
                 message.role === 'user'
                   ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 ml-12"
                   : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800"
               )}>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>

              {/* Message Actions */}
              <div className={cn(
                "flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400",
                message.role === 'user' ? "justify-end mr-12" : "ml-12"
              )}>
                <span>{formatTimestamp(message.timestamp)}</span>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      onClick={() => handleCopyMessage(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      onClick={() => handleRegenerateResponse(message.id)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mr-auto">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
              <ConvocoreLogo showText={false} size="sm" />
            </div>
            <div className="flex-1 ml-12">
                             <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Convocore is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
        <AIInputDemo
          placeholder="Type your message..."
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
} 