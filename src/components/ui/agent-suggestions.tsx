"use client";

import { useState, useEffect } from 'react';
import { CONVO_AGENTS, ConvoAgent } from '@/lib/model-agents';
import { 
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentSuggestionsProps {
  query: string;
  onSelect: (agent: ConvoAgent) => void;
  className?: string;
}

export function AgentSuggestions({ query, onSelect, className }: AgentSuggestionsProps) {
  const [filteredAgents, setFilteredAgents] = useState<ConvoAgent[]>([]);

  useEffect(() => {
    if (query.startsWith('@')) {
      const searchTerm = query.slice(1).toLowerCase();
      const filtered = CONVO_AGENTS.filter(agent =>
        agent.tag.toLowerCase().includes(`@${searchTerm}`) ||
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.displayName.toLowerCase().includes(searchTerm)
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents([]);
    }
  }, [query]);

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

  if (filteredAgents.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50",
      className
    )}>
      <div className="p-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
          Specialized Agents
        </div>
        {filteredAgents.map((agent) => {
          const AgentIcon = getAgentIcon(agent.icon);
          return (
            <button
              key={agent.tag}
              onClick={() => onSelect(agent)}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md text-left transition-colors"
            >
              <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white", agent.color)}>
                <AgentIcon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {agent.tag}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {agent.displayName}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {agent.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      
      {query === '@' && (
        <div className="border-t border-gray-200 dark:border-zinc-700 p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Type to search agents or continue typing your message
          </div>
        </div>
      )}
    </div>
  );
} 