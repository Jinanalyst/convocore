'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { AIAgent, ChatMessage, ConversationContext, ToolResult, AgentCapability } from '@/lib/advanced-ai-agent';
import { advancedAIAgent } from '@/lib/advanced-ai-agent';
import { formatAIResponseToParagraphs } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { usageService } from '@/lib/usage-service';
import { notificationService } from '@/lib/notification-service';
import { 
  BotIcon, 
  UserIcon, 
  SettingsIcon, 
  SendIcon, 
  MicIcon, 
  PaperclipIcon,
  RefreshCwIcon,
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  BrainIcon,
  CodeIcon,
  SearchIcon,
  CalculatorIcon,
  ImageIcon,
  FileTextIcon,
  BarChart3Icon,
  GlobeIcon,
  PlayIcon,
  Square
} from 'lucide-react';

interface AdvancedChatInterfaceProps {
  sessionId?: string;
  userId?: string;
  initialAgent?: string;
}

interface ProcessingStage {
  stage: 'analyzing' | 'selecting_tools' | 'executing_tools' | 'generating_response' | 'complete';
  message: string;
  progress: number;
}

export default function AdvancedChatInterface({ 
  sessionId = nanoid(), 
  userId = 'user', 
  initialAgent = 'general-assistant' 
}: AdvancedChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AIAgent | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AIAgent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize agents and select current agent
  useEffect(() => {
    const agents = advancedAIAgent.getAvailableAgents();
    setAvailableAgents(agents);
    
    const selectedAgent = agents.find(a => a.id === initialAgent) || agents[0];
    setCurrentAgent(selectedAgent);
  }, [initialAgent]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, processingStage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !currentAgent || isProcessing) return;

    // Usage tracking for free plan (per message)
    if (!usageService.canMakeRequest(userId)) {
      notificationService.notifyError(
        'Daily Limit Reached',
        'You have used all of your free daily chats. Upgrade to Pro for unlimited usage.'
      );
      return;
    }
    usageService.incrementUsage(userId);

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Create conversation context
    const context: ConversationContext = {
      sessionId,
      userId,
      messages: [...messages, userMessage],
      currentAgent: currentAgent.id,
      activeTools: [],
      userPreferences: currentAgent.memory.userProfile.preferences,
      environmentContext: {
        platform: 'web',
        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        browser: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        capabilities: ['text', 'audio', 'image']
      }
    };

    try {
      // Simulate processing stages
      setProcessingStage({
        stage: 'analyzing',
        message: 'Analyzing your request...',
        progress: 25
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      setProcessingStage({
        stage: 'selecting_tools',
        message: 'Selecting appropriate tools...',
        progress: 50
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      setProcessingStage({
        stage: 'executing_tools',
        message: 'Executing tools and gathering information...',
        progress: 75
      });

      // Process the message with the AI agent
      const response = await advancedAIAgent.processMessage(
        userMessage.content,
        context,
        currentAgent.id
      );

      setProcessingStage({
        stage: 'generating_response',
        message: 'Generating response...',
        progress: 90
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          model: response.model,
          tokensUsed: response.tokensUsed,
          toolsUsed: response.toolsUsed,
          confidence: response.confidence,
          processingTime: response.processingTime
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveTools(response.toolsUsed);

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }, [inputValue, currentAgent, messages, sessionId, userId, isProcessing]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgentChange = (agent: AIAgent) => {
    setCurrentAgent(agent);
    setShowAgentSelector(false);
  };

  const handleRegenerateResponse = (messageIndex: number) => {
    // Implementation for regenerating the last response
    console.log('Regenerating response for message index:', messageIndex);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getToolIcon = (toolName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'web_search': <SearchIcon className="w-4 h-4" />,
      'calculator': <CalculatorIcon className="w-4 h-4" />,
      'code_analyzer': <CodeIcon className="w-4 h-4" />,
      'code_executor': <PlayIcon className="w-4 h-4" />,
      'image_generator': <ImageIcon className="w-4 h-4" />,
      'file_reader': <FileTextIcon className="w-4 h-4" />,
      'data_analyzer': <BarChart3Icon className="w-4 h-4" />,
      'translator': <GlobeIcon className="w-4 h-4" />
    };
    
    return iconMap[toolName] || <BrainIcon className="w-4 h-4" />;
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Agent Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
            >
              <div className="flex items-center gap-2">
                <BotIcon className="w-4 h-4" />
                <span className="truncate">{currentAgent?.name || 'Select Agent'}</span>
              </div>
              <SettingsIcon className="w-4 h-4" />
            </Button>
            
            {showAgentSelector && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                {availableAgents.map(agent => (
                  <button
                    key={agent.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                    onClick={() => handleAgentChange(agent)}
                  >
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {agent.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent Capabilities */}
        {currentAgent && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between mb-2"
              onClick={() => setShowCapabilities(!showCapabilities)}
            >
              <span>Capabilities</span>
              <span className="text-xs">{currentAgent.capabilities.length}</span>
            </Button>
            
            {showCapabilities && (
              <div className="space-y-2">
                {currentAgent.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{capability.type.replace('_', ' ')}</span>
                    <Badge variant={capability.enabled ? 'default' : 'secondary'}>
                      {capability.enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Tools */}
        {activeTools.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium mb-2">Active Tools</div>
            <div className="flex flex-wrap gap-1">
              {activeTools.map((tool, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {getToolIcon(tool)}
                  <span className="text-xs">{tool.replace('_', ' ')}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm font-medium mb-2">Recent Conversations</div>
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start text-left">
              <span className="truncate">New conversation with {currentAgent?.name}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BotIcon className="w-5 h-5" />
              <div>
                <div className="font-medium">{currentAgent?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentAgent?.model} • {currentAgent?.capabilities.length} capabilities
                </div>
              </div>
            </div>
            
            {isProcessing && processingStage && (
              <div className="flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {processingStage.message}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <BrainIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Ready to assist you!</p>
              <p>Ask me anything - I have access to powerful tools and capabilities.</p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageComponent
              key={message.id}
              message={message}
              onRegenerate={() => handleRegenerateResponse(index)}
              onCopy={() => handleCopyMessage(message.content)}
            />
          ))}

          {/* Processing Indicator */}
          {isProcessing && processingStage && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <BotIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">{processingStage.message}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingStage.progress}%` }}
                    ></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${currentAgent?.name}...`}
                className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                rows={1}
                disabled={isProcessing}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button size="sm" variant="ghost" disabled={isProcessing}>
                  <PaperclipIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" disabled={isProcessing}>
                  <MicIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              size="sm"
              className="px-3"
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {currentAgent?.name} can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Component
interface MessageComponentProps {
  message: ChatMessage;
  onRegenerate: () => void;
  onCopy: () => void;
}

function MessageComponent({ message, onRegenerate, onCopy }: MessageComponentProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTimestamp = (timestamp: Date | string | number) => {
    const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if dateObj is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  return (
    <div 
      className="flex items-start gap-3 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        message.role === 'user' 
          ? 'bg-blue-500' 
          : 'bg-green-500'
      }`}>
        {message.role === 'user' ? (
          <UserIcon className="w-4 h-4 text-white" />
        ) : (
          <BotIcon className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.metadata?.model && (
            <Badge variant="outline" className="text-xs">
              {message.metadata.model}
            </Badge>
          )}
        </div>

        <Card className="p-4">
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">
              {message.role === 'assistant' 
                ? formatAIResponseToParagraphs(message.content)
                : message.content
              }
            </div>
          </div>

          {/* Metadata */}
          {message.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {message.metadata.tokensUsed && (
                  <span>Tokens: {message.metadata.tokensUsed}</span>
                )}
                {message.metadata.processingTime && (
                  <span>Time: {message.metadata.processingTime}ms</span>
                )}
                {message.metadata.confidence && (
                  <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                )}
              </div>

              {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tools:</span>
                  {message.metadata.toolsUsed.map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Actions */}
        {showActions && message.role === 'assistant' && (
          <div className="flex items-center gap-1 mt-2">
            <Button size="sm" variant="ghost" onClick={onCopy}>
              <CopyIcon className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onRegenerate}>
              <RefreshCwIcon className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <ThumbsUpIcon className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost">
              <ThumbsDownIcon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 