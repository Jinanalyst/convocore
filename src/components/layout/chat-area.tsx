"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { ConvocoreLogo } from "@/components/ui/convocore-logo";
import { Button } from "@/components/ui/button";
import { VoiceModal } from "@/components/modals/voice-modal";
import { EnhancedChatMessage } from "@/components/ui/enhanced-chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { usageService } from "@/lib/usage-service";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from '@/lib/language-context';
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
import { cn, formatAIResponseToParagraphs } from "@/lib/utils";
import { ConvoAgent } from "@/lib/model-agents";
import { detectAgentFromMessage, formatMessageWithAgent } from "@/lib/intelligent-agent-router";
import { ChatLimitIndicator } from '@/components/ui/chat-limit-indicator';
import { notificationService } from '@/lib/notification-service';
import { formatChatTimestamp } from '@/lib/date-utils';
import { speechService } from "@/lib/speech-recognition";

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

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
  onSendMessage?: (message: string, model: string, includeWebSearch?: boolean) => Promise<string | undefined>;
}

export function ChatArea({ className, chatId, onSendMessage }: ChatAreaProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<ConvoAgent | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
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
    if (!conversationId) return;

    try {
      setIsLoading(true);
      console.log('🔄 Loading messages for conversation:', conversationId);

      // Check if user is using wallet authentication or local/demo chat
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const isLocalChat = walletConnected
        || conversationId.startsWith('wallet_chat_')
        || conversationId.startsWith('demo_')
        || conversationId.startsWith('local_chat_');

      if (isLocalChat) {
        // For wallet users or demo/local chats, load from localStorage
        const savedMessages = localStorage.getItem(`chat_messages_${conversationId}`);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          const formattedMessages: Message[] = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(formattedMessages);
          console.log('📥 Loaded', formattedMessages.length, 'messages from localStorage');
        } else {
          console.log('📭 No saved messages found for this chat');
          setMessages([]);
        }
        return;
      }

      // For Supabase authenticated users, load from database
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = messages?.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at)
      })) || [];

      setMessages(formattedMessages);
      console.log('📥 Loaded', formattedMessages.length, 'messages from database');
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageWithOptions = useCallback(async (
    content: string,
    options?: { think?: boolean; deepSearch?: boolean }
  ) => {
    if (!content.trim()) return;

    console.log('📨 ChatArea received message with options:', {
      content: content.substring(0, 50) + '...',
      model,
      includeWebSearch,
      options,
      language
    });

    const newMessage: Message = {
      id: generateId(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    try {
      // Determine target chat id; if absent, request parent to create one
      let targetChatId = chatId;
      if (!targetChatId && onSendMessage) {
        targetChatId = await onSendMessage(content.trim(), model, includeWebSearch);
        // We won't have react re-render with new prop immediately, so just use this id locally.
      } else {
        // Notify parent as usual (no need to await)
        onSendMessage?.(content.trim(), model, includeWebSearch);
      }

      // Detect agent from message content
      const detectedAgent = detectAgentFromMessage(content);

      // Call API with enhanced options including language
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage].map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          })),
          model,
          chatId: targetChatId,
          includeWebSearch: includeWebSearch || options?.deepSearch,
          deepSearch: options?.deepSearch,
          think: options?.think,
          language: language // Pass language preference to API
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: generateId(),
        content: data.response || 'Sorry, I could not generate a response.',
        role: 'assistant',
        timestamp: new Date(),
        agent: detectedAgent || undefined
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the assistant's reply aloud if supported
      try {
        if (speechService.isSpeechSynthesisSupported()) {
          speechService.speak(assistantMessage.content);
        }
      } catch (e) {
        console.warn('Speech synthesis failed:', e);
      }

      // Save assistant message
      if (targetChatId) {
        await saveMessage(targetChatId, assistantMessage.content, 'assistant');
      }

      // Notify chat completion with proper parameters
      const chatTitle = targetChatId || 'New Chat';
      notificationService.notifyChatComplete(
        chatTitle,
        assistantMessage.content,
        targetChatId
      );

      // Increment usage for free plan indicator
      try {
        if (user?.id) {
          const result = usageService.incrementUsage(user.id);
          if (!result.success && result.limitExceeded) {
            console.warn('Free plan limit reached');
          }
        }
      } catch (err) {
        console.error('Usage increment failed:', err);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Notify user of the error
      const errorTitle = language === 'ko' ? '메시지 전송 실패' : 'Message Send Failed';
      const errorMsg = language === 'ko' 
        ? '메시지를 처리하는 중에 오류가 발생했습니다. 다시 시도해 주세요.'
        : 'There was an error processing your message. Please try again.';
      
      notificationService.notifyError(errorTitle, errorMsg);
      
      const errorMessage: Message = {
        id: generateId(),
        content: errorMsg,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, model, includeWebSearch, chatId, language, onSendMessage]);

  const saveMessage = async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    try {
      console.log('💾 Saving message:', { conversationId, role, content: content.substring(0, 50) + '...' });

      // Check if user is using wallet authentication
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (walletConnected || conversationId.startsWith('wallet_chat_') || conversationId.startsWith('demo_')) {
        // For wallet users or demo chats, save to localStorage
        const messageToSave = {
          id: generateId(),
          content,
          role,
          timestamp: new Date().toISOString()
        };

        // Get existing messages
        const existingMessages = localStorage.getItem(`chat_messages_${conversationId}`);
        const messages = existingMessages ? JSON.parse(existingMessages) : [];
        
        // Add new message
        messages.push(messageToSave);
        
        // Save back to localStorage
        localStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(messages));
        console.log('✅ Message saved to localStorage');

        // Send to backend for wallet conversations
        if (conversationId && !conversationId.startsWith('demo_')) {
          try {
            await fetch('/api/wallet/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId, role, content })
            });
          } catch (err) {
            console.warn('Failed to sync wallet message to backend:', err);
          }
        }
        
        // Also update the chat list with the latest message
        const walletChats = localStorage.getItem('wallet_chats');
        if (walletChats) {
          const chats = JSON.parse(walletChats);
          const updatedChats = chats.map((chat: any) => 
            chat.id === conversationId 
              ? { 
                  ...chat, 
                  lastMessage: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                  timestamp: new Date().toISOString()
                }
              : chat
          );
          localStorage.setItem('wallet_chats', JSON.stringify(updatedChats));
        }
        return;
      }

      // For Supabase authenticated users, save to database
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
        console.error('Error saving message to database:', error);
        // Fallback to localStorage if database fails
        const messageToSave = {
          id: generateId(),
          content,
          role,
          timestamp: new Date().toISOString()
        };

        const existingMessages = localStorage.getItem(`chat_messages_${conversationId}`);
        const messages = existingMessages ? JSON.parse(existingMessages) : [];
        messages.push(messageToSave);
        localStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(messages));
        console.log('📦 Fallback: Message saved to localStorage');
      } else {
        console.log('✅ Message saved to database');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      // Final fallback to localStorage
      try {
        const messageToSave = {
          id: generateId(),
          content,
          role,
          timestamp: new Date().toISOString()
        };

        const existingMessages = localStorage.getItem(`chat_messages_${conversationId}`);
        const messages = existingMessages ? JSON.parse(existingMessages) : [];
        messages.push(messageToSave);
        localStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(messages));
        console.log('🆘 Emergency fallback: Message saved to localStorage');
      } catch (fallbackError) {
        console.error('Failed to save message even with fallback:', fallbackError);
      }
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    
    // Show success notification
    const successTitle = language === 'ko' ? '복사됨' : 'Copied';
    const successMsg = language === 'ko' ? '메시지가 클립보드에 복사되었습니다' : 'Message copied to clipboard';
    
    notificationService.notifySuccess(successTitle, successMsg);
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
    console.log('Voice input requested - opening voice modal');
    setVoiceModalOpen(true);
  };

  const handleVoiceTranscriptComplete = (transcript: string) => {
    console.log('Voice transcript received:', transcript);
    // Auto-submit the voice message with default model
    sendMessageWithOptions(transcript);
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
          {/* Header Section - Mobile Optimized */}
          <div className="flex-shrink-0 text-center px-4 sm:px-6 pt-4 sm:pt-12 pb-3 sm:pb-8">
            <ConvocoreLogo size="lg" className="mx-auto mb-3 sm:mb-6" />
            

            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              Your intelligent conversational AI platform
            </p>
          </div>

          {/* Feature Cards Section - Mobile Optimized */}
          <div className="flex-1 px-4 sm:px-6 pb-2 sm:pb-4">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-2 sm:space-y-4">
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
            <div className="px-4 sm:px-6 py-2 sm:py-4">
              {/* Chat Limit Indicator */}
              <ChatLimitIndicator className="max-w-2xl mx-auto mb-2 sm:mb-4" />
              
              <AIChatInput
                onSendMessage={(message, options) => {
                  // Use default model and handle new options
                  sendMessageWithOptions(message, options);
                }}
                onAttachFile={handleFileUpload}
                onVoiceInput={handleVoiceInput}
                className="max-w-2xl mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Voice Modal */}
        <VoiceModal
          open={voiceModalOpen}
          onOpenChange={setVoiceModalOpen}
          onTranscriptComplete={handleVoiceTranscriptComplete}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Area with Scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md mx-auto px-4">
              <ConvocoreLogo className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50" />
              <div className="space-y-2">

                <p className="text-sm text-muted-foreground/80">
                  Start a conversation by typing a message below. You can use specialized agents by mentioning them with @ (e.g., @codegen, @writer, @debugger).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <EnhancedChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                role={message.role}
                timestamp={message.timestamp}
                agent={message.agent}
                isTyping={message.isTyping}
                streamingSpeed={25}
                onCopy={() => handleCopyMessage(message.content)}
                                 onShare={() => {
                   notificationService.notifySuccess('Shared!', 'Message shared to clipboard');
                 }}
                 onRegenerate={() => handleRegenerateResponse(message.id)}
                 onFeedback={(type) => {
                   if (type === 'up') {
                     notificationService.notifySuccess('Feedback Received', 'Thank you for your positive feedback!');
                   } else {
                     notificationService.notifyInfo('Feedback Received', 'Thank you for your feedback!');
                   }
                 }}
              />
            ))}
            
            {/* Enhanced Typing indicator */}
            {isTyping && (
              <TypingIndicator
                isVisible={true}
                message={`${currentAgent?.displayName || 'AI'} is thinking...`}
                avatar={
                  currentAgent ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                      {currentAgent.tag.slice(1, 3).toUpperCase()}
                    </div>
                  ) : undefined
                }
              />
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
            sendMessageWithOptions(message, options);
          }}
          onAttachFile={handleFileUpload}
          onVoiceInput={handleVoiceInput}
          className="w-full"
        />
      </div>

      {/* Voice Modal */}
      <VoiceModal
        open={voiceModalOpen}
        onOpenChange={setVoiceModalOpen}
        onTranscriptComplete={handleVoiceTranscriptComplete}
      />
    </div>
  );
} 