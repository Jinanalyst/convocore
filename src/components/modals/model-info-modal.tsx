"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Zap, Brain, Code, MessageSquare, Star, ExternalLink, Bug, Palette, Image, PenTool, Database, TrendingUp, Rocket, MessageCircle, Copy } from 'lucide-react';
import { CONVO_AGENTS } from '@/lib/model-agents';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import Link from 'next/link';

interface ModelInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelInfoModal({ open, onOpenChange }: ModelInfoModalProps) {
  const { t } = useLanguage();
  
  const models = [
    {
      name: "Convocore Omni",
      provider: "Convocore",
      description: t('model.omni.description'),
      features: ["Text & Image Processing", "Code Generation", "Advanced Reasoning", "128K Context"],
      contextLength: "128,000 tokens",
      speed: "Fast",
      isDefault: true,
      color: "bg-green-500"
    },
    {
      name: "Convocore Alpha",
      provider: "Convocore",
      description: t('model.alpha.description'),
      features: ["Superior Reasoning", "Creative Writing", "Code Analysis", "200K Context"],
      contextLength: "200,000 tokens",
      speed: "Medium",
      isDefault: false,
      color: "bg-purple-500"
    },
    {
      name: "Convocore Turbo",
      provider: "Convocore",
      description: t('model.turbo.description'),
      features: ["Balanced Performance", "Code & Text", "JSON Mode", "128K Context"],
      contextLength: "128,000 tokens",
      speed: "Fast",
      isDefault: false,
      color: "bg-blue-500"
    },
    {
      name: "Convocore Nova",
      provider: "Convocore",
      description: t('model.nova.description'),
      features: ["Balanced Capabilities", "Efficient Processing", "Code & Writing", "200K Context"],
      contextLength: "200,000 tokens",
      speed: "Fast",
      isDefault: false,
      color: "bg-indigo-500"
    }
  ];

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

  const capabilities = [
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description: "Natural, context-aware conversations with memory of chat history"
    },
    {
      icon: Code,
      title: "Code Generation",
      description: "Write, debug, and explain code in multiple programming languages"
    },
    {
      icon: Brain,
      title: "Advanced Reasoning",
      description: "Complex problem-solving and analytical thinking capabilities"
    },
    {
      icon: Zap,
      title: "Real-time Responses",
      description: "Fast, streaming responses for immediate feedback"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Convocore AI Models
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Platform Overview */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Advanced AI Technology Platform
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Convocore brings together cutting-edge AI capabilities through our proprietary model suite, 
              delivering superior performance and specialized functionality for any task.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-2">
                  <capability.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {capability.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Convocore Agents */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Convocore Specialized Agents
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use @ mentions to activate specialized AI agents for specific tasks
            </p>
            <div className="grid gap-3 md:grid-cols-2 mb-8">
              {CONVO_AGENTS.map((agent, index) => {
                const AgentIcon = getAgentIcon(agent.icon);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-zinc-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
                    onClick={() => {
                      navigator.clipboard.writeText(agent.tag);
                      // Show a toast or notification that the tag was copied
                    }}
                    title={`Click to copy ${agent.tag}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white", agent.color)}>
                        <AgentIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {agent.tag} - {agent.displayName}
                        </h4>
                      </div>
                      <Copy className="w-3 h-3 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      {agent.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 2).map((capability, capIndex) => (
                        <span
                          key={capIndex}
                          className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                        >
                          {capability}
                        </span>
                      ))}
                      {agent.capabilities.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{agent.capabilities.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Models */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Base AI Models
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {models.map((model, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${model.color}`} />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {model.name}
                          {model.isDefault && (
                            <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          by {model.provider}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {model.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {model.features.map((feature, featureIndex) => (
                        <span
                          key={featureIndex}
                          className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Context: {model.contextLength}</span>
                      <span>Speed: {model.speed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              Usage Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Specialized Agents:</h4>
                <p>• Type <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">@codegen build a login form</code> for complete code generation</p>
                <p>• Use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">@debugger fix this error</code> to analyze and fix code issues</p>
                <p>• Try <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">@uiwizard design a pricing page</code> for beautiful UI components</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Convocore Models:</h4>
                <p>• <strong>Convocore Omni:</strong> Best for general tasks, multimodal inputs, and balanced performance</p>
                <p>• <strong>Convocore Alpha:</strong> Ideal for complex reasoning, creative writing, and detailed analysis</p>
                <p>• <strong>Convocore Turbo:</strong> Great for code generation and when you need faster responses</p>
                <p>• <strong>Convocore Nova:</strong> Perfect balance of capability and speed for most conversations</p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Want unlimited access?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Upgrade to Pro or Premium for unlimited requests and advanced features
                </p>
              </div>
              <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
                <Link href="/pricing">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 