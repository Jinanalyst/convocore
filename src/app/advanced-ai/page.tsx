'use client';

import { useState, useEffect } from 'react';
import AdvancedChatInterface from '@/components/ui/advanced-chat-interface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { advancedAIAgent } from '@/lib/advanced-ai-agent';
import { ensureInitialized } from '@/lib/ai-agent-initialization';
import { 
  BrainIcon, 
  CodeIcon, 
  SearchIcon, 
  TrendingUpIcon,
  PaletteIcon,
  SettingsIcon,
  InfoIcon,
  ZapIcon
} from 'lucide-react';

export default function AdvancedAIPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('general-assistant');
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [userId, setUserId] = useState<string>('anonymous');

  useEffect(() => {
    // Initialize the AI system and load agents
    const initializeSystem = async () => {
      try {
        ensureInitialized();
        const availableAgents = advancedAIAgent.getAvailableAgents();
        setAgents(availableAgents);
        
        // Get system statistics
        const stats = await fetch('/api/chat').then(res => res.json());
        setSystemStats(stats);
        
        // Get user ID from localStorage or use anonymous
        const walletAddress = localStorage.getItem('wallet_address');
        const localUserId = localStorage.getItem('user_id');
        setUserId(walletAddress || localUserId || 'anonymous');
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize AI system:', error);
        setIsLoading(false);
      }
    };

    initializeSystem();
  }, []);

  const getAgentIcon = (agentId: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      'general-assistant': <BrainIcon className="w-5 h-5" />,
      'code-specialist': <CodeIcon className="w-5 h-5" />,
      'research-analyst': <SearchIcon className="w-5 h-5" />,
      'creative-assistant': <PaletteIcon className="w-5 h-5" />
    };
    return iconMap[agentId] || <BrainIcon className="w-5 h-5" />;
  };

  const getAgentColor = (agentId: string) => {
    const colorMap: { [key: string]: string } = {
      'general-assistant': 'bg-blue-500',
      'code-specialist': 'bg-green-500',
      'research-analyst': 'bg-purple-500',
      'creative-assistant': 'bg-pink-500'
    };
    return colorMap[agentId] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing Advanced AI System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ZapIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Convocore Advanced AI
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Next-generation AI with specialized agents and powerful tools
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {systemStats && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Badge variant="outline">
                    {systemStats.total_agents} Agents
                  </Badge>
                  <Badge variant="outline">
                    {systemStats.available_tools} Tools
                  </Badge>
                  <Badge variant="default" className="bg-green-500">
                    {systemStats.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Agent Selection Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Your AI Agent
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedAgent === agent.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getAgentColor(agent.id)}`}>
                    {getAgentIcon(agent.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className="text-xs">
                        {agent.model}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {agent.capabilities.length} capabilities
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {agent.tools.length} tools
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
          <AdvancedChatInterface
            sessionId={`advanced-ai-${Date.now()}`}
            userId={userId}
            initialAgent={selectedAgent}
          />
        </div>

        {/* System Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <InfoIcon className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">System Status</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Version:</span>
                <span className="text-gray-900 dark:text-white">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <Badge variant="default" className="bg-green-500">
                  {systemStats?.status || 'Online'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                <span className="text-gray-900 dark:text-white">99.9%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">Performance</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Response:</span>
                <span className="text-gray-900 dark:text-white">1.2s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                <span className="text-gray-900 dark:text-white">99.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tools Active:</span>
                <span className="text-gray-900 dark:text-white">{systemStats?.available_tools || 10}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <SettingsIcon className="w-4 h-4 text-purple-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">Capabilities</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Web Search</span>
                <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Code Execution</span>
                <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Image Generation</span>
                <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 