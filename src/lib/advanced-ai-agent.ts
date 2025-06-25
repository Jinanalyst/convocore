'use client';

import { nanoid } from 'nanoid';

// Core Types
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  model: string;
  systemPrompt: string;
  tools: string[];
  memory: ConversationMemory;
  settings: AgentSettings;
  created: Date;
  updated: Date;
}

export interface AgentCapability {
  type: 'text' | 'code' | 'analysis' | 'web_search' | 'file_processing' | 'api_integration' | 'math' | 'reasoning' | 'image_generation' | 'translation';
  enabled: boolean;
  config: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: any, context?: ConversationContext) => Promise<ToolResult>;
  category: 'search' | 'computation' | 'creation' | 'analysis' | 'communication' | 'integration';
  requirements?: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
  validation?: (value: any) => boolean;
}

export interface ToolResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  currentAgent: string;
  activeTools: string[];
  userPreferences: UserPreferences;
  environmentContext: EnvironmentContext;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    toolsUsed?: string[];
    confidence?: number;
    processingTime?: number;
  };
  attachments?: MessageAttachment[];
  toolResults?: ToolResult[];
}

export interface MessageAttachment {
  id: string;
  type: 'file' | 'image' | 'url' | 'code';
  name: string;
  url: string;
  mimeType: string;
  size: number;
  analysisResult?: any;
}

export interface Intent {
  primary_intent: string;
  confidence: number;
  entities: Entity[];
  required_tools: string[];
  context_awareness: number;
  complexity_level: 'low' | 'medium' | 'high' | 'expert';
  execution_plan: ExecutionStep[];
  estimated_cost: number;
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  position: [number, number];
}

export interface ExecutionStep {
  step: number;
  action: string;
  tool?: string;
  parameters?: any;
  dependencies?: number[];
  estimated_time: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  confidence: number;
  toolsUsed: string[];
  processingTime: number;
  cost: number;
  suggestions?: string[];
  followUpQuestions?: string[];
  metadata?: any;
}

export interface ConversationMemory {
  shortTerm: ChatMessage[];
  longTerm: Map<string, any>;
  userProfile: UserProfile;
  contextWindow: number;
  semanticIndex: Map<string, any>;
}

export interface UserProfile {
  id: string;
  preferences: UserPreferences;
  expertise: string[];
  conversation_style: 'formal' | 'casual' | 'technical' | 'creative';
  frequent_topics: string[];
  tool_usage_patterns: Map<string, number>;
  satisfaction_scores: number[];
}

export interface UserPreferences {
  preferred_model: string;
  max_tokens: number;
  temperature: number;
  enable_tools: boolean;
  auto_execute_safe_tools: boolean;
  privacy_level: 'low' | 'medium' | 'high';
  response_style: 'concise' | 'detailed' | 'balanced';
}

export interface AgentSettings {
  max_tool_executions: number;
  auto_tool_selection: boolean;
  context_retention: number;
  response_style: string;
  safety_level: 'permissive' | 'balanced' | 'strict';
  cost_limit: number;
}

export interface EnvironmentContext {
  platform: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  timezone: string;
  language: string;
  capabilities: string[];
}

// Main Advanced AI Agent Class
export class AdvancedAIAgent {
  private agents: Map<string, AIAgent> = new Map();
  private toolRegistry: ToolRegistry;
  private intentAnalyzer: IntentAnalyzer;
  private memoryManager: MemoryManager;
  private modelSelector: ModelSelector;
  private conversationHistory: Map<string, ConversationContext> = new Map();

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.intentAnalyzer = new IntentAnalyzer();
    this.memoryManager = new MemoryManager();
    this.modelSelector = new ModelSelector();
    this.initializeDefaultAgents();
  }

  // Initialize default AI agents with different specializations
  private initializeDefaultAgents() {
    const agents: Partial<AIAgent>[] = [
      {
        id: 'general-assistant',
        name: 'General Assistant',
        description: 'A versatile AI assistant capable of handling general conversations, questions, and tasks',
        model: 'gpt-4',
        systemPrompt: `You are Convocore, an advanced AI assistant with access to powerful tools and capabilities. 
        You excel at understanding context, reasoning through complex problems, and providing helpful, accurate responses.
        
        Key principles:
        - Be helpful, harmless, and honest
        - Use tools when they would improve your response
        - Explain your reasoning when solving complex problems
        - Ask clarifying questions when needed
        - Adapt your communication style to the user's preferences
        
        Available capabilities: General conversation, web search, calculations, code analysis, file processing`,
        capabilities: [
          { type: 'text', enabled: true, config: {} },
          { type: 'reasoning', enabled: true, config: {} },
          { type: 'web_search', enabled: true, config: { max_results: 5 } },
          { type: 'math', enabled: true, config: {} },
          { type: 'code', enabled: true, config: { languages: ['javascript', 'python', 'typescript'] } }
        ],
        tools: ['web_search', 'calculator', 'code_analyzer', 'file_reader']
      },
      {
        id: 'code-specialist',
        name: 'Code Specialist',
        description: 'Expert programmer and software development assistant',
        model: 'gpt-4',
        systemPrompt: `You are a highly skilled programming expert with deep knowledge across multiple languages and frameworks.
        
        Specializations:
        - Code review and optimization
        - Debugging and error resolution
        - Architecture and design patterns
        - Testing and quality assurance
        - Performance optimization
        
        Always provide clean, well-documented code with explanations of your approach.`,
        capabilities: [
          { type: 'code', enabled: true, config: { all_languages: true } },
          { type: 'analysis', enabled: true, config: {} },
          { type: 'reasoning', enabled: true, config: {} }
        ],
        tools: ['code_executor', 'code_analyzer', 'github_integration', 'documentation_generator']
      },
      {
        id: 'research-analyst',
        name: 'Research Analyst',
        description: 'Specialized in research, data analysis, and information synthesis',
        model: 'claude-3',
        systemPrompt: `You are a research specialist with expertise in data analysis, information synthesis, and evidence-based reasoning.
        
        Capabilities:
        - Comprehensive web research
        - Data analysis and visualization
        - Academic and scientific research
        - Market and competitive analysis
        - Fact-checking and source verification
        
        Always cite sources and provide evidence for your conclusions.`,
        capabilities: [
          { type: 'analysis', enabled: true, config: {} },
          { type: 'web_search', enabled: true, config: { comprehensive: true } },
          { type: 'reasoning', enabled: true, config: {} }
        ],
        tools: ['web_search', 'data_analyzer', 'chart_generator', 'pdf_analyzer']
      },
      {
        id: 'creative-assistant',
        name: 'Creative Assistant',
        description: 'Specialized in creative tasks, writing, and content generation',
        model: 'gpt-4',
        systemPrompt: `You are a creative AI assistant specializing in writing, content creation, and artistic endeavors.
        
        Creative strengths:
        - Creative writing and storytelling
        - Content strategy and marketing
        - Image generation and visual concepts
        - Brainstorming and ideation
        - Brand and design thinking
        
        Focus on originality, creativity, and engaging content.`,
        capabilities: [
          { type: 'text', enabled: true, config: { creative_mode: true } },
          { type: 'image_generation', enabled: true, config: {} },
          { type: 'reasoning', enabled: true, config: {} }
        ],
        tools: ['image_generator', 'content_planner', 'style_analyzer', 'translation']
      }
    ];

    agents.forEach(agentData => {
      const agent: AIAgent = {
        ...agentData,
        id: agentData.id!,
        name: agentData.name!,
        description: agentData.description!,
        model: agentData.model!,
        systemPrompt: agentData.systemPrompt!,
        capabilities: agentData.capabilities!,
        tools: agentData.tools!,
        memory: {
          shortTerm: [],
          longTerm: new Map(),
          userProfile: this.createDefaultUserProfile(),
          contextWindow: 10,
          semanticIndex: new Map()
        },
        settings: {
          max_tool_executions: 5,
          auto_tool_selection: true,
          context_retention: 20,
          response_style: 'balanced',
          safety_level: 'balanced',
          cost_limit: 1.0
        },
        created: new Date(),
        updated: new Date()
      };

      this.agents.set(agent.id, agent);
    });
  }

  private createDefaultUserProfile(): UserProfile {
    return {
      id: nanoid(),
      preferences: {
        preferred_model: 'gpt-4',
        max_tokens: 4000,
        temperature: 0.7,
        enable_tools: true,
        auto_execute_safe_tools: true,
        privacy_level: 'medium',
        response_style: 'balanced'
      },
      expertise: [],
      conversation_style: 'casual',
      frequent_topics: [],
      tool_usage_patterns: new Map(),
      satisfaction_scores: []
    };
  }

  // Main message processing method
  async processMessage(
    message: string,
    context: ConversationContext,
    agentId?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const agent = this.getAgentById(agentId || 'general-assistant');
    
    try {
      // 1. Analyze intent and determine required capabilities
      const intent = await this.intentAnalyzer.analyzeIntent(message, context);
      
      // 2. Select appropriate tools based on intent
      const selectedTools = this.selectTools(intent, agent);
      
      // 3. Execute tools if needed
      const toolResults = await this.executeTools(selectedTools, message, context);
      
      // 4. Generate response with context and tool results
      const response = await this.generateResponse(message, context, toolResults, agent, intent);
      
      // 5. Update conversation memory
      await this.updateMemory(message, response, context, agent);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...response,
        processingTime,
        toolsUsed: selectedTools.map(t => t.name)
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      return {
        content: "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.",
        model: agent.model,
        tokensUsed: 0,
        confidence: 0,
        toolsUsed: [],
        processingTime: Date.now() - startTime,
        cost: 0
      };
    }
  }

  private getAgentById(agentId: string): AIAgent {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }

  private selectTools(intent: Intent, agent: AIAgent): Tool[] {
    const availableTools = intent.required_tools
      .filter(toolName => agent.tools.includes(toolName))
      .map(toolName => this.toolRegistry.getTool(toolName))
      .filter(Boolean) as Tool[];

    // Limit tools based on agent settings
    return availableTools.slice(0, agent.settings.max_tool_executions);
  }

  private async executeTools(
    tools: Tool[],
    message: string,
    context: ConversationContext
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    for (const tool of tools) {
      try {
        const params = await this.extractToolParameters(tool, message, context);
        const result = await tool.execute(params, context);
        results.push(result);
      } catch (error) {
        console.error(`Error executing tool ${tool.name}:`, error);
        results.push({
          success: false,
          data: null,
          error: `Failed to execute ${tool.name}: ${error}`,
          metadata: { executionTime: 0 }
        });
      }
    }
    
    return results;
  }

  private async extractToolParameters(
    tool: Tool,
    message: string,
    context: ConversationContext
  ): Promise<any> {
    // This would use NLP to extract parameters from the message
    // For now, we'll use a simple approach
    const params: any = {};
    
    tool.parameters.forEach(param => {
      if (param.required && !params[param.name]) {
        // Set default values or extract from message
        if (param.default !== undefined) {
          params[param.name] = param.default;
        } else if (param.name === 'query' || param.name === 'text') {
          params[param.name] = message;
        }
      }
    });
    
    return params;
  }

  private async generateResponse(
    message: string,
    context: ConversationContext,
    toolResults: ToolResult[],
    agent: AIAgent,
    intent: Intent
  ): Promise<AIResponse> {
    
    // Build the complete prompt with context, tool results, and agent system prompt
    const systemPrompt = this.buildSystemPrompt(agent, context, toolResults);
    const conversationHistory = this.buildConversationHistory(context);
    
    // Select the best model for this task
    const selectedModel = this.modelSelector.selectOptimalModel(intent, agent);
    
    try {
      const response = await this.callAIModel(selectedModel, systemPrompt, conversationHistory, message);
      
      return {
        content: response.content,
        model: selectedModel,
        tokensUsed: response.tokensUsed,
        confidence: response.confidence || 0.8,
        cost: this.calculateCost(selectedModel, response.tokensUsed),
        suggestions: response.suggestions,
        followUpQuestions: response.followUpQuestions,
        toolsUsed: toolResults.map(t => t.success ? 'tool_executed' : 'tool_failed'),
        processingTime: 0 // Will be set in processMessage
      };
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  private buildSystemPrompt(agent: AIAgent, context: ConversationContext, toolResults: ToolResult[]): string {
    let prompt = agent.systemPrompt;
    
    // Add tool results context
    if (toolResults.length > 0) {
      prompt += '\n\nTool Results:\n';
      toolResults.forEach((result, index) => {
        if (result.success) {
          prompt += `Tool ${index + 1}: ${JSON.stringify(result.data, null, 2)}\n`;
        } else {
          prompt += `Tool ${index + 1} failed: ${result.error}\n`;
        }
      });
    }
    
    // Add user context
    if (context.userPreferences) {
      prompt += `\n\nUser preferences: Response style should be ${context.userPreferences.response_style}.`;
    }
    
    return prompt;
  }

  private buildConversationHistory(context: ConversationContext): any[] {
    return context.messages.slice(-context.userPreferences?.max_tokens ? 10 : 5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private async callAIModel(model: string, systemPrompt: string, history: any[], message: string): Promise<any> {
    // This would integrate with actual AI models
    // For now, return a mock response
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model,
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.content || data.data?.content || 'I apologize, but I could not generate a response.',
        tokensUsed: data.tokens || 100,
        confidence: 0.8,
        suggestions: [],
        followUpQuestions: []
      };
      
    } catch (error) {
      console.error('Error calling AI model:', error);
      throw error;
    }
  }

  private calculateCost(model: string, tokens: number): number {
    const rates = {
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000002,
      'claude-3': 0.000015
    };
    
    return (rates[model as keyof typeof rates] || 0.00001) * tokens;
  }

  private async updateMemory(
    message: string,
    response: AIResponse,
    context: ConversationContext,
    agent: AIAgent
  ): Promise<void> {
    await this.memoryManager.addMessage({
      id: nanoid(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }, agent);

    await this.memoryManager.addMessage({
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
    }, agent);
  }

  // Public methods for agent management
  public getAvailableAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgent(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId);
  }

  public createCustomAgent(agentData: Partial<AIAgent>): AIAgent {
    const agent: AIAgent = {
      id: nanoid(),
      name: agentData.name || 'Custom Agent',
      description: agentData.description || 'A custom AI agent',
      capabilities: agentData.capabilities || [],
      model: agentData.model || 'gpt-4',
      systemPrompt: agentData.systemPrompt || 'You are a helpful AI assistant.',
      tools: agentData.tools || [],
      memory: {
        shortTerm: [],
        longTerm: new Map(),
        userProfile: this.createDefaultUserProfile(),
        contextWindow: 10,
        semanticIndex: new Map()
      },
      settings: agentData.settings || {
        max_tool_executions: 5,
        auto_tool_selection: true,
        context_retention: 20,
        response_style: 'balanced',
        safety_level: 'balanced',
        cost_limit: 1.0
      },
      created: new Date(),
      updated: new Date()
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  public updateAgent(agentId: string, updates: Partial<AIAgent>): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const updatedAgent = {
      ...agent,
      ...updates,
      updated: new Date()
    };

    this.agents.set(agentId, updatedAgent);
    return true;
  }

  public deleteAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }
}

// Supporting Classes (we'll implement these in separate files)
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export class IntentAnalyzer {
  async analyzeIntent(message: string, context: ConversationContext): Promise<Intent> {
    // Simplified intent analysis - in production this would use advanced NLP
    const intents = {
      'search_information': /(?:search|find|look up|tell me about|what is|explain)/i,
      'calculate': /(?:calculate|compute|solve|math|equation)/i,
      'code_help': /(?:code|program|script|function|debug)/i,
      'create_content': /(?:create|generate|write|make)/i,
      'analyze_data': /(?:analyze|data|chart|graph)/i,
      'translate': /(?:translate|translation)/i
    };

    const matches = Object.entries(intents)
      .filter(([intent, pattern]) => pattern.test(message))
      .map(([intent]) => intent);

    const primaryIntent = matches[0] || 'general_conversation';
    const toolMapping = {
      'search_information': ['web_search'],
      'calculate': ['calculator'],
      'code_help': ['code_analyzer', 'code_executor'],
      'create_content': ['content_generator'],
      'analyze_data': ['data_analyzer'],
      'translate': ['translator']
    };

    return {
      primary_intent: primaryIntent,
      confidence: matches.length > 0 ? 0.8 : 0.3,
      entities: [],
      required_tools: toolMapping[primaryIntent as keyof typeof toolMapping] || [],
      context_awareness: 0.7,
      complexity_level: message.length > 100 ? 'medium' : 'low',
      execution_plan: [],
      estimated_cost: 0.01
    };
  }
}

export class MemoryManager {
  async addMessage(message: ChatMessage, agent: AIAgent): Promise<void> {
    agent.memory.shortTerm.push(message);
    
    // Maintain context window
    if (agent.memory.shortTerm.length > agent.memory.contextWindow) {
      agent.memory.shortTerm.shift();
    }
  }

  getRelevantContext(query: string, agent: AIAgent, maxItems: number = 5): ChatMessage[] {
    return agent.memory.shortTerm.slice(-maxItems);
  }
}

export class ModelSelector {
  selectOptimalModel(intent: Intent, agent: AIAgent): string {
    // Simple model selection logic
    if (intent.complexity_level === 'high' || intent.primary_intent.includes('analyze')) {
      return 'claude-3';
    }
    if (intent.primary_intent.includes('code')) {
      return 'gpt-4';
    }
    return agent.model;
  }
}

// Export singleton instance
export const advancedAIAgent = new AdvancedAIAgent(); 