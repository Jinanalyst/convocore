"use client";

import { useState, useRef, useEffect } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { usageService } from "@/lib/usage-service";
import { useAuth } from "@/lib/auth-context";
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
  MessageCircle,
  FileText,
  Volume2,
  VolumeX,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { detectAgentFromMessage, formatMessageWithAgent, ConvoAgent } from "@/lib/model-agents";
import { ChatLimitIndicator } from '@/components/ui/chat-limit-indicator';

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
  onSendMessage?: (message: string, model: string, includeWebSearch?: boolean) => void;
}

export function ChatArea({ className, chatId, onSendMessage }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<ConvoAgent | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
      // Skip loading if no proper conversation ID
      if (!conversationId || conversationId === 'chat_demo') {
        console.log('Demo mode - not loading messages from database');
        setMessages([]);
        return;
      }

      // Check if we have Supabase configuration
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured, using local storage instead');
        setMessages([]);
        return;
      }

      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not load messages from Supabase (expected if not configured):', error.message);
        setMessages([]);
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
      console.warn('Could not load messages (expected if Supabase not configured):', error instanceof Error ? error.message : 'Unknown error');
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

  const handleSendMessage = async (content: string, model: string, includeWebSearch?: boolean) => {
    if (!content.trim()) return;

    // Check usage limit before processing
    if (user && !usageService.canMakeRequest(user.id)) {
      const usage = usageService.getUserUsage(user.id);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `🚫 **Daily Limit Reached**\n\nYou've used ${usage.requestsUsed}/${usage.requestsLimit} requests today.\n\nUpgrade to Pro (20 USDT/month) for 1,000 requests or Premium (40 USDT/month) for 5,000 requests per month.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    console.log('🚀 Sending message:', { content, model, chatId });

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
      // Create a chatId if we don't have one
      const currentChatId = chatId || `chat_${Date.now()}`;
      
      // Save user message to database if we have a chatId
      if (currentChatId !== 'chat_demo') {
        try {
          await saveMessage(currentChatId, content, 'user');
        } catch (error) {
          console.log('Could not save message to database (expected in demo mode):', error);
        }
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

      console.log('📤 Calling chat API with', apiMessages.length, 'messages');

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          chatId: currentChatId,
          temperature: 0.7,
          maxTokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting specifically
        if (response.status === 429 && errorData.type === 'RATE_LIMIT_EXCEEDED') {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `🚫 ${errorData.error}\n\nYou can upgrade to Pro (20 USDT/month) or Premium (40 USDT/month) for unlimited chats. Visit our pricing page to learn more.`,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return; // Don't increment usage if rate limited
        }

        // Handle API configuration errors
        if (response.status === 503) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `🔧 **Configuration Issue**\n\n${errorData.details || errorData.error}\n\nPlease check your environment variables and restart the development server.`,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        // Handle other API errors with details
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `⚠️ **Error (${response.status})**\n\n${errorData.details || errorData.error || 'Unknown error occurred'}\n\n${errorData.suggestion || 'Please try again or contact support.'}`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const data = await response.json();
      
      // Increment real usage tracking after successful response
      if (user) {
        try {
          const result = usageService.incrementUsage(user.id);
          console.log('Usage updated:', result);
          
          // Trigger storage event for other components to update
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'usage_updated',
            newValue: user.id,
            oldValue: null
          }));
        } catch (error) {
          console.warn('Failed to update usage tracking:', error);
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        agent: detectedAgent || undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database if we have a chatId
      if (currentChatId !== 'chat_demo') {
        await saveMessage(currentChatId, data.response, 'assistant');
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

    onSendMessage?.(content, model, includeWebSearch);
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

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    console.log('File uploaded:', file.name, file.type, file.size);
    // In a real implementation, this would process the file
    const fileMessage: Message = {
      id: Date.now().toString(),
      content: `📎 Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, fileMessage]);
  };

  const handleVoiceInput = () => {
    console.log('Voice input requested');
    // In a real implementation, this would start voice recording
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice transcript:', transcript);
        // Auto-submit the voice message
        handleSendMessage(transcript, 'gpt-4o');
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        alert('Speech recognition error: ' + event.error);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
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

  const handleTextToSpeech = (text: string) => {
    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!chatId && messages.length === 0) {
    return (
      <div className={cn("flex flex-col h-full bg-gray-50 dark:bg-zinc-950", className)}>
        {/* Welcome Screen */}
        <div className="flex-1 flex flex-col">
          {/* Header Section */}
          <div className="flex-shrink-0 text-center px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
            <ConvocoreLogo size="lg" className="justify-center mb-4 sm:mb-6" />
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Welcome to Convocore
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              Your intelligent conversational AI platform
            </p>
          </div>

          {/* Feature Cards Section - Mobile Optimized */}
          <div className="flex-1 px-4 sm:px-6 pb-4">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-3 sm:space-y-4">
                {/* Feature Card 1 */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Smart Conversations</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Advanced AI models for intelligent conversations
                    </p>
                  </div>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Custom AI Agents</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Specialized agents for specific tasks
                    </p>
                  </div>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Prompt Library</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Curated prompts and templates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              {/* Chat Limit Indicator */}
              <ChatLimitIndicator className="max-w-2xl mx-auto mb-3 sm:mb-4" />
              
              <AIChatInput
                onSendMessage={(message, options) => {
                  // Use default model and handle new options
                  handleSendMessage(message, 'gpt-4', options?.deepSearch);
                }}
                onAttachFile={handleFileUpload}
                onVoiceInput={handleVoiceInput}
                className="max-w-2xl mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Area with Scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md mx-auto">
              <ConvocoreLogo className="mx-auto h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Welcome to Convocore AI
                </h3>
                <p className="text-sm text-muted-foreground/80">
                  Start a conversation by typing a message below. You can use specialized agents by mentioning them with @ (e.g., @codegen, @writer, @debugger).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="message-container">
                {/* Message bubble implementation stays the same */}
                <div className={cn(
                  "flex items-start gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {message.agent ? (
                        getAgentIcon(message.agent.icon)
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 space-y-2",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {message.agent && message.role === 'assistant' && (
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        {getAgentIcon(message.agent.icon)}
                        <span>{message.agent.displayName}</span>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRegenerateResponse(message.id)}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleTextToSpeech(message.content)}
                          >
                            {isSpeaking ? (
                              <VolumeX className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Usage indicator */}
      <div className="px-4 py-2 border-t">
        <ChatLimitIndicator />
      </div>

      {/* Input Area - Reduced Size */}
      <div className="p-4 border-t bg-background">
        <AIChatInput
          onSendMessage={(message, options) => {
            // Use default model and handle new options
            handleSendMessage(message, 'gpt-4', options?.deepSearch);
          }}
          onAttachFile={handleFileUpload}
          onVoiceInput={handleVoiceInput}
          className="w-full"
        />
      </div>
    </div>
  );
} 