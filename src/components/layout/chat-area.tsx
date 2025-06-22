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
  Sparkles,
  Code,
  Bug,
  Palette,
  Image,
  PenTool,
  Database,
  TrendingUp,
  Rocket,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { detectAgentFromMessage, formatMessageWithAgent, ConvoAgent } from "@/lib/model-agents";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  agent?: ConvoAgent;
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

  // Load real messages from Supabase
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const loadMessages = async (conversationId: string) => {
    try {
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = messagesData?.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at),
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to empty messages if Supabase not configured
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, model: string) => {
    if (!content.trim()) return;

    // Detect if user is calling a specific agent
    const detectedAgent = detectAgentFromMessage(content);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      agent: detectedAgent || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message to database if we have a chatId
      if (chatId) {
        await saveMessage(chatId, content, 'user');
      }

      // Prepare the message content for API
      let apiContent = content;
      if (detectedAgent) {
        // Format message with agent-specific system prompt
        apiContent = formatMessageWithAgent(content, detectedAgent);
      }

      // Prepare messages for API
      const apiMessages = [...messages, { 
        role: 'user' as const, 
        content: apiContent 
      }];

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
          maxTokens: 4096, // Increased for agent responses
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
        timestamp: new Date(),
        agent: detectedAgent || undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database if we have a chatId
      if (chatId) {
        await saveMessage(chatId, data.data.content, 'assistant');
      }
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

  const saveMessage = async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    try {
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          role,
        });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
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

  const getAgentIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Code,
      Bug,
      Palette,
      Image,
      PenTool,
      Database,
      TrendingUp,
      Rocket,
      Bot,
      MessageCircle
    };
    return iconMap[iconName] || Bot;
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
                 : message.agent 
                   ? `${message.agent.color} text-white`
                   : "bg-gray-100 dark:bg-zinc-900"
            )}>
                             {message.role === 'user' ? (
                 <User className="w-4 h-4 text-white dark:text-gray-900" />
               ) : message.agent ? (
                 (() => {
                   const AgentIcon = getAgentIcon(message.agent.icon);
                   return <AgentIcon className="w-4 h-4" />;
                 })()
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
                {/* Agent Header */}
                {message.agent && message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-zinc-700">
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white", message.agent.color)}>
                      {(() => {
                        const AgentIcon = getAgentIcon(message.agent.icon);
                        return <AgentIcon className="w-3 h-3" />;
                      })()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {message.agent.displayName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.agent.description}
                    </span>
                  </div>
                )}
                
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