'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { AIDocumentViewer } from './ai-document-viewer';
import { EnhancedChatMessage } from './enhanced-chat-message';
import { TypingIndicator } from './typing-indicator';
import { createDocumentFromResponse } from '@/lib/document-service';
import { FileText, Code, Zap, Share2 } from 'lucide-react';

const demoMessages = [
  {
    id: '1',
    content: `# React Component Generator

Here's a complete React component that demonstrates modern patterns:

\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ id, text, completed, onToggle, onDelete }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(id)}
        className="w-4 h-4 rounded border-gray-300"
      />
      
      <span className={completed ? 'line-through text-gray-500' : 'text-gray-900'}>
        {text}
      </span>
      
      {isHovered && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onDelete(id)}
          className="ml-auto text-red-500 hover:text-red-700"
        >
          Delete
        </motion.button>
      )}
    </motion.div>
  );
}
\`\`\`

This component includes:
- **TypeScript interfaces** for type safety
- **Framer Motion animations** for smooth transitions
- **Hover interactions** with state management
- **Conditional rendering** for better UX
- **Accessible form controls** following best practices

The component is fully reusable and follows modern React patterns with hooks, proper event handling, and responsive design principles.`,
    role: 'assistant' as const,
    timestamp: new Date(),
    agent: {
      name: 'codegen',
      displayName: 'Code Generator',
      tag: '@codegen',
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: 'code',
      description: 'Generates clean, modern code',
      systemPrompt: 'You are a code generator',
      capabilities: ['typescript', 'react', 'animations'],
      examples: ['Create a component']
    }
  },
  {
    id: '2',
    content: `# Marketing Strategy Document

## Executive Summary

Our Q4 marketing strategy focuses on three key pillars: digital transformation, customer retention, and brand expansion. This comprehensive approach will drive 40% growth in user acquisition while maintaining our premium positioning.

## Target Audience Analysis

### Primary Segments
- **Tech Professionals** (25-40 years)
  - High disposable income
  - Early adopters of new technology
  - Value efficiency and innovation

- **Small Business Owners** (30-50 years)
  - Seeking scalable solutions
  - Budget-conscious but quality-focused
  - Need comprehensive support

### Secondary Segments
- **Enterprise Decision Makers** (35-55 years)
- **Educational Institutions** (All ages)

## Campaign Strategy

### Phase 1: Brand Awareness (Weeks 1-4)
- Social media blitz across LinkedIn, Twitter, and YouTube
- Influencer partnerships with tech thought leaders
- Content marketing with 3 blog posts per week
- Webinar series "Future of AI in Business"

### Phase 2: Lead Generation (Weeks 5-8)
- Free trial campaigns with premium features
- Case study releases featuring success stories
- Partnership announcements with major platforms
- Trade show participation and speaking engagements

### Phase 3: Conversion Optimization (Weeks 9-12)
- Retargeting campaigns for trial users
- Personalized email sequences
- Limited-time promotional offers
- Customer testimonial campaigns

## Budget Allocation
- Digital Advertising: 40%
- Content Creation: 25%
- Events & Partnerships: 20%
- Tools & Analytics: 10%
- Contingency: 5%

## Success Metrics
- **User Acquisition**: 40% increase
- **Conversion Rate**: 12% improvement
- **Brand Awareness**: 60% lift in key demographics
- **Customer Lifetime Value**: 25% growth

This strategy leverages our strengths while addressing market opportunities for sustainable growth.`,
    role: 'assistant' as const,
    timestamp: new Date(),
    agent: {
      name: 'writer',
      displayName: 'Content Writer',
      tag: '@writer',
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      icon: 'pen',
      description: 'Creates compelling written content',
      systemPrompt: 'You are a content writer',
      capabilities: ['writing', 'marketing', 'strategy'],
      examples: ['Write a strategy document']
    }
  }
];

export function DocumentDemo() {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  const handleStartDemo = async () => {
    setIsTyping(true);
    setShowDocument(false);
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      setShowDocument(true);
    }, 3000);
  };

  const handleNextDemo = () => {
    setCurrentDemo((prev) => (prev + 1) % demoMessages.length);
    setShowDocument(false);
  };

  const currentMessage = demoMessages[currentDemo];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Claude-Style Document System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Interactive documents with real-time typing, sharing, and editing
          </p>
        </motion.div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
            <Zap className="w-4 h-4" />
            Real-time Typing
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
            <FileText className="w-4 h-4" />
            Auto Document Creation
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
            <Share2 className="w-4 h-4" />
            Shareable Links
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
            <Code className="w-4 h-4" />
            Code Detection
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleStartDemo}
          disabled={isTyping}
          className="px-6"
        >
          {isTyping ? 'AI is typing...' : 'Start Demo'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleNextDemo}
          className="px-6"
        >
          Next Example ({currentDemo + 1}/{demoMessages.length})
        </Button>
      </div>

      {/* Demo Area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[600px]">
        {/* Chat Interface */}
        <div className="p-6 space-y-6">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3">
              <p className="text-sm">
                {currentMessage.agent?.tag} {
                  currentMessage.agent?.name === 'codegen' 
                    ? 'Create a React todo component with animations'
                    : 'Write a comprehensive Q4 marketing strategy'
                }
              </p>
            </div>
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator
              isVisible={true}
              message={`${currentMessage.agent?.displayName} is crafting your response...`}
              avatar={
                <div className={`w-8 h-8 rounded-full ${currentMessage.agent?.color} flex items-center justify-center text-white text-xs font-medium`}>
                  {currentMessage.agent?.tag.slice(1, 3).toUpperCase()}
                </div>
              }
            />
          )}

          {/* AI Response with Document */}
          {!isTyping && showDocument && (
            <EnhancedChatMessage
              id={currentMessage.id}
              content={currentMessage.content}
              role={currentMessage.role}
              timestamp={currentMessage.timestamp}
              agent={currentMessage.agent}
              isTyping={false}
              streamingSpeed={20}
              onCopy={() => console.log('Copied!')}
              onShare={() => console.log('Shared!')}
              onRegenerate={() => console.log('Regenerating...')}
              onFeedback={(type) => console.log('Feedback:', type)}
            />
          )}
        </div>
      </div>

      {/* Features Explanation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🎨 Interactive Documents
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI responses automatically become shareable, editable documents. Long-form content, code snippets, and structured data are intelligently converted into interactive artifacts.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            ⚡ Real-time Streaming
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Watch AI responses unfold in real-time with character-by-character streaming. Includes typing indicators, progress animations, and smooth text flow.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🔗 Shareable Links
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate secure, time-limited sharing links for any document. Recipients can view, edit (if permitted), and interact with the content directly.
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🤖 Smart Detection
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically detects content type (code, markdown, text) and formats accordingly. Includes syntax highlighting, proper typography, and structure preservation.
          </p>
        </div>
      </div>
    </div>
  );
} 