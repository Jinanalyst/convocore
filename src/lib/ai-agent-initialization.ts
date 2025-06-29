'use client';

import { advancedAIAgent, ToolRegistry } from './advanced-ai-agent';
import { 
  webSearchTool, 
  calculatorTool, 
  codeAnalyzerTool, 
  codeExecutorTool,
  fileReaderTool,
  imageGeneratorTool,
  translationTool,
  dataAnalyzerTool,
  chartGeneratorTool,
  apiCallerTool,
  allTools 
} from './ai-tools';

// Initialize the AI agent system with all tools
export function initializeAIAgent() {
  // Get the tool registry from the advanced AI agent
  const toolRegistry = (advancedAIAgent as any).toolRegistry as ToolRegistry;
  
  // Register all available tools
  allTools.forEach(tool => {
    toolRegistry.register(tool);
  });

  console.log(`AI Agent initialized with ${allTools.length} tools:`, allTools.map(t => t.name));
  
  return {
    agent: advancedAIAgent,
    availableTools: allTools,
    toolCount: allTools.length
  };
}

// Export individual tools for use elsewhere
export {
  webSearchTool,
  calculatorTool, 
  codeAnalyzerTool,
  codeExecutorTool,
  fileReaderTool,
  imageGeneratorTool,
  translationTool,
  dataAnalyzerTool,
  chartGeneratorTool,
  apiCallerTool
};

// Tool categories for UI organization
export const toolCategories = {
  search: ['web_search'],
  computation: ['calculator', 'code_executor'],
  analysis: ['code_analyzer', 'file_reader', 'data_analyzer'],
  creation: ['image_generator', 'chart_generator'],
  communication: ['translator'],
  integration: ['api_caller']
};

// Tool descriptions for UI display
export const toolDescriptions = {
  'web_search': 'Search the internet for current information',
  'calculator': 'Perform mathematical calculations',
  'code_analyzer': 'Analyze code for errors and improvements',
  'code_executor': 'Execute code safely in a sandbox',
  'file_reader': 'Read and analyze uploaded files',
  'image_generator': 'Generate images from text descriptions',
  'translator': 'Translate text between languages',
  'data_analyzer': 'Analyze data and generate insights',
  'chart_generator': 'Create charts and visualizations',
  'api_caller': 'Make API calls to external services'
};

// Initialize on module load
let initialized = false;

export function ensureInitialized() {
  if (!initialized) {
    initializeAIAgent();
    initialized = true;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  ensureInitialized();
}

// Only initialize advanced AI agent tools for Pro and Premium plans. Not for free plan. 