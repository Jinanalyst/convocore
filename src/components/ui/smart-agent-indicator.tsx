'use client';

import { useState, useEffect } from 'react';
import { ConvoAgent } from '@/lib/model-agents';
import { getAgentSuggestions } from '@/lib/intelligent-agent-router';
import { Bot, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SmartAgentIndicatorProps {
  message: string;
  onAgentSelect?: (agent: ConvoAgent) => void;
  className?: string;
}

export function SmartAgentIndicator({ message, onAgentSelect, className }: SmartAgentIndicatorProps) {
  const [suggestions, setSuggestions] = useState<Array<{ agent: ConvoAgent; confidence: number; reason: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (message.trim().length > 10 && !message.includes('@')) {
      const agentSuggestions = getAgentSuggestions(message, 2);
      setSuggestions(agentSuggestions);
      setShowSuggestions(agentSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [message]);

  const handleAgentSelect = (agent: ConvoAgent) => {
    onAgentSelect?.(agent);
    setShowSuggestions(false);
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "absolute bottom-full left-0 right-0 mb-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg backdrop-blur-sm z-40",
          className
        )}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <Bot className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI detected these specialists for your task:
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Agent Suggestions */}
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.agent.tag}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAgentSelect(suggestion.agent)}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md text-left transition-all duration-200 hover:shadow-sm"
              >
                {/* Agent Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-sm",
                  suggestion.agent.color
                )}>
                  {suggestion.agent.tag.slice(1, 3).toUpperCase()}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {suggestion.agent.displayName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.agent.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {suggestion.agent.description}
                  </p>
                </div>

                {/* Confidence Score */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(suggestion.confidence * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {Math.round(suggestion.confidence * 100)}% match
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Click to use this specialist, or continue typing to use general AI
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 