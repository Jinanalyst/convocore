'use client';

import { ConvoAgent, CONVO_AGENTS } from './model-agents';

// Intent patterns for automatic agent detection
interface IntentPattern {
  keywords: string[];
  phrases: string[];
  contexts: string[];
  confidence: number;
}

// Agent detection patterns - each agent has specific triggers
const AGENT_PATTERNS: Record<string, IntentPattern> = {
  '@codegen': {
    keywords: ['code', 'function', 'component', 'programming', 'script', 'build', 'create', 'develop', 'implement'],
    phrases: [
      'create a component', 'build a function', 'write code', 'develop a', 'implement',
      'react component', 'vue component', 'api endpoint', 'database schema',
      'javascript function', 'python script', 'typescript', 'next.js', 'node.js'
    ],
    contexts: ['programming', 'development', 'coding', 'software', 'web development'],
    confidence: 0.8
  },
  
  '@debugger': {
    keywords: ['error', 'bug', 'fix', 'debug', 'issue', 'problem', 'broken', 'not working', 'crash'],
    phrases: [
      'fix this error', 'debug this', 'why is this not working', 'error message',
      'cannot read property', 'undefined', 'null reference', 'syntax error',
      'runtime error', 'compilation error', 'exception', 'stack trace'
    ],
    contexts: ['debugging', 'error resolution', 'troubleshooting'],
    confidence: 0.9
  },

  '@uiwizard': {
    keywords: ['design', 'ui', 'interface', 'layout', 'style', 'css', 'theme', 'responsive'],
    phrases: [
      'design a', 'create ui', 'build interface', 'style component',
      'responsive design', 'css styling', 'tailwind', 'bootstrap',
      'user interface', 'landing page', 'dashboard', 'form design'
    ],
    contexts: ['ui design', 'styling', 'frontend design', 'user experience'],
    confidence: 0.8
  },

  '@writer': {
    keywords: ['write', 'content', 'copy', 'article', 'blog', 'marketing', 'documentation'],
    phrases: [
      'write a', 'create content', 'draft article', 'marketing copy',
      'blog post', 'documentation', 'readme', 'email template',
      'landing page copy', 'product description'
    ],
    contexts: ['content creation', 'copywriting', 'documentation', 'marketing'],
    confidence: 0.8
  },

  '@analyst': {
    keywords: ['analyze', 'data', 'chart', 'graph', 'statistics', 'metrics', 'report'],
    phrases: [
      'analyze data', 'create chart', 'data visualization', 'statistics',
      'generate report', 'performance metrics', 'user analytics',
      'data insights', 'trend analysis'
    ],
    contexts: ['data analysis', 'analytics', 'reporting', 'visualization'],
    confidence: 0.8
  },

  '@chainscope': {
    keywords: ['crypto', 'blockchain', 'token', 'bitcoin', 'ethereum', 'defi', 'nft'],
    phrases: [
      'analyze token', 'crypto analysis', 'blockchain data', 'on-chain',
      'ethereum address', 'bitcoin address', 'defi protocol',
      'token price', 'market cap', 'trading volume', 'smart contract'
    ],
    contexts: ['cryptocurrency', 'blockchain', 'defi', 'trading'],
    confidence: 0.9
  },

  '@imagegen': {
    keywords: ['image', 'picture', 'visual', 'generate', 'create', 'design', 'art'],
    phrases: [
      'generate image', 'create picture', 'design visual', 'image prompt',
      'dall-e', 'midjourney', 'stable diffusion', 'ai art',
      'logo design', 'illustration', 'graphic design'
    ],
    contexts: ['image generation', 'visual design', 'ai art', 'graphics'],
    confidence: 0.8
  },

  '@consultant': {
    keywords: ['strategy', 'business', 'plan', 'advice', 'recommendation', 'optimize'],
    phrases: [
      'business strategy', 'growth plan', 'market analysis', 'competitive analysis',
      'business advice', 'startup advice', 'optimization', 'best practices',
      'go-to-market', 'business model'
    ],
    contexts: ['business strategy', 'consulting', 'planning', 'optimization'],
    confidence: 0.8
  },

  '@calculator': {
    keywords: ['calculate', 'math', 'formula', 'equation', 'compute', 'solve'],
    phrases: [
      'calculate', 'solve equation', 'mathematical', 'compute',
      'percentage', 'conversion', 'formula', 'arithmetic',
      'algebra', 'geometry', 'statistics calculation'
    ],
    contexts: ['mathematics', 'calculations', 'formulas', 'computation'],
    confidence: 0.9
  },

  '@deploy': {
    keywords: ['deploy', 'deployment', 'ci/cd', 'docker', 'kubernetes', 'hosting'],
    phrases: [
      'deploy app', 'deployment pipeline', 'ci/cd setup', 'docker container',
      'kubernetes', 'vercel deploy', 'netlify deploy', 'aws deploy',
      'production deployment', 'staging environment'
    ],
    contexts: ['deployment', 'devops', 'infrastructure', 'hosting'],
    confidence: 0.8
  }
};

/**
 * Intelligent Agent Router
 * Automatically detects the most appropriate agent based on message content
 * Falls back to manual @ detection if no automatic match is found
 */
export class IntelligentAgentRouter {
  
  /**
   * Main routing function - tries automatic detection first, then manual @ detection
   */
  static detectBestAgent(message: string): ConvoAgent | null {
    // First priority: Check for explicit @ mentions (preserve existing functionality)
    const explicitAgent = this.detectExplicitAgent(message);
    if (explicitAgent) {
      console.log(`🎯 Explicit agent detected: ${explicitAgent.name}`);
      return explicitAgent;
    }

    // Second priority: Intelligent automatic detection
    const autoAgent = this.detectAutomaticAgent(message);
    if (autoAgent) {
      console.log(`🤖 Auto-detected agent: ${autoAgent.agent.name} (confidence: ${autoAgent.confidence})`);
      return autoAgent.agent;
    }

    // No agent detected - use general AI
    return null;
  }

  /**
   * Detect explicit @ mentions (existing functionality)
   */
  private static detectExplicitAgent(message: string): ConvoAgent | null {
    const lowerMessage = message.toLowerCase();
    
    for (const agent of CONVO_AGENTS) {
      if (lowerMessage.includes(agent.tag.toLowerCase())) {
        return agent;
      }
    }
    
    return null;
  }

  /**
   * Intelligent automatic agent detection based on content analysis
   */
  private static detectAutomaticAgent(message: string): { agent: ConvoAgent; confidence: number } | null {
    const lowerMessage = message.toLowerCase();
    const candidates: { agent: ConvoAgent; score: number }[] = [];

    // Analyze message against each agent pattern
    for (const [agentTag, pattern] of Object.entries(AGENT_PATTERNS)) {
      const agent = CONVO_AGENTS.find(a => a.tag === agentTag);
      if (!agent) continue;

      let score = 0;
      let matches = 0;

      // Check keyword matches
      for (const keyword of pattern.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
          matches++;
        }
      }

      // Check phrase matches (higher weight)
      for (const phrase of pattern.phrases) {
        if (lowerMessage.includes(phrase)) {
          score += 2;
          matches++;
        }
      }

      // Check context matches
      for (const context of pattern.contexts) {
        if (lowerMessage.includes(context)) {
          score += 1.5;
          matches++;
        }
      }

      // Calculate confidence based on matches and base confidence
      if (matches > 0) {
        const confidence = Math.min((score / (pattern.keywords.length + pattern.phrases.length)) * pattern.confidence, 1.0);
        candidates.push({ agent, score: confidence });
      }
    }

    // Sort by confidence and return the best match if above threshold
    candidates.sort((a, b) => b.score - a.score);
    
    const bestMatch = candidates[0];
    const confidenceThreshold = 0.3; // Minimum confidence to auto-select

    if (bestMatch && bestMatch.score >= confidenceThreshold) {
      return { agent: bestMatch.agent, confidence: bestMatch.score };
    }

    return null;
  }

  /**
   * Get suggested agents for a message (for UI hints)
   */
  static getSuggestedAgents(message: string, limit: number = 3): Array<{ agent: ConvoAgent; confidence: number; reason: string }> {
    const lowerMessage = message.toLowerCase();
    const suggestions: Array<{ agent: ConvoAgent; confidence: number; reason: string }> = [];

    for (const [agentTag, pattern] of Object.entries(AGENT_PATTERNS)) {
      const agent = CONVO_AGENTS.find(a => a.tag === agentTag);
      if (!agent) continue;

      let score = 0;
      let reasons: string[] = [];

      // Analyze keywords
      for (const keyword of pattern.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
          reasons.push(`keyword: "${keyword}"`);
        }
      }

      // Analyze phrases
      for (const phrase of pattern.phrases) {
        if (lowerMessage.includes(phrase)) {
          score += 2;
          reasons.push(`phrase: "${phrase}"`);
        }
      }

      if (score > 0) {
        const confidence = Math.min((score / pattern.keywords.length) * pattern.confidence, 1.0);
        suggestions.push({
          agent,
          confidence,
          reason: reasons.slice(0, 2).join(', ') // Show top 2 reasons
        });
      }
    }

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Enhanced message formatting that preserves @ functionality while adding smart routing
   */
  static formatMessageWithAgent(message: string, agent: ConvoAgent): string {
    // Remove any @ mentions from the message but preserve the intent
    const cleanMessage = message.replace(new RegExp(agent.tag, 'gi'), '').trim();
    
    return `${agent.systemPrompt}

User Request: ${cleanMessage}

Please respond as ${agent.name} (${agent.displayName}) with your specialized expertise in: ${agent.capabilities.join(', ')}. 

Focus on providing actionable, detailed solutions that match your capabilities. If the request doesn't align with your specialization, acknowledge it and provide general guidance while suggesting a more appropriate agent if available.`;
  }
}

// Export helper functions for backward compatibility
export function detectAgentFromMessage(message: string): ConvoAgent | null {
  return IntelligentAgentRouter.detectBestAgent(message);
}

export function formatMessageWithAgent(message: string, agent: ConvoAgent): string {
  return IntelligentAgentRouter.formatMessageWithAgent(message, agent);
}

export function getAgentSuggestions(message: string, limit?: number) {
  return IntelligentAgentRouter.getSuggestedAgents(message, limit);
} 