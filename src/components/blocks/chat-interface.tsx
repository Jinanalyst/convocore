"use client";

import { ConvoAILogo } from "@/components/ui/convo-ai-logo";
import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { MemoryStatus } from "@/components/ui/memory-status";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAIInputSubmit = async (message: string, model: string, includeWebSearch?: boolean) => {
    if (!message.trim()) return;

    // Update selected model if different
    if (model !== selectedModel) {
      setSelectedModel(model);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let responseContent = "";
      
      if (includeWebSearch) {
        // Simulate web search + AI response
        responseContent = `🌐 **Web Search Enabled**\n\nI searched the web for information about "${message}" and found relevant results. Here's what I found:\n\n• Recent developments and current information\n• Multiple perspectives from reliable sources\n• Up-to-date data and statistics\n\nBased on the web search results, here's my comprehensive response using ${model}:\n\n${message.includes('?') ? 'This is a detailed answer' : 'This is relevant information'} incorporating the latest web information. In a real implementation, this would include actual search results and AI-generated insights.`;
      } else {
        // Regular AI response
        responseContent = `I received your message: "${message}". This is a response from ConvoAI using ${model}. In a real implementation, this would connect to the selected AI service and provide intelligent responses based on the model's training data.`;
      }

      // Simulate AI response delay
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, includeWebSearch ? 2500 : 1500); // Longer delay for web search
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name, file.type, file.size);
    // In a real implementation, this would process the file
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `📎 Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      sender: "user",
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
        // You could auto-fill the input or submit directly
        handleAIInputSubmit(transcript, selectedModel);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <ConvoAILogo />
        </div>
      </header>

      {/* Chat Messages Area with Custom Scrollbar */}
      <div 
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-zinc-500"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent'
        }}
      >
        <div className="container mx-auto max-w-4xl min-h-full">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 min-h-full flex flex-col justify-center"
            >
              <ConvoAILogo className="justify-center mb-6" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Convocore
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Your intelligent conversational AI platform. Start a conversation, explore our library, or configure your AI model settings.
              </p>
              
              {/* Memory Status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <MemoryStatus className="max-w-md mx-auto" />
              </motion.div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Smart Conversations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Engage with advanced AI models for natural, intelligent conversations
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Custom AI Agents
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Create and configure specialized AI agents for specific tasks
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Prompt Library
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Access a curated collection of prompts and templates
                  </p>
                </motion.div>
              </div>

            </motion.div>
          ) : (
            <div className="space-y-6 pb-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-2xl rounded-lg px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Convocore is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <AIInputDemo 
            onSubmit={handleAIInputSubmit}
            onFileUpload={handleFileUpload}
            onVoiceInput={handleVoiceInput}
            placeholder="What can I do for you?"
            className="max-w-4xl mx-auto"
          />
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
            Convocore can make mistakes. Check important info and verify responses.
          </p>
        </div>
      </div>
    </div>
  );
} 