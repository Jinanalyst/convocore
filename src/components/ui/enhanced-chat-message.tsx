'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  User, 
  Copy, 
  Share2, 
  FileText, 
  Code, 
  Edit3,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import { AIDocumentViewer } from './ai-document-viewer';
import { TypingIndicator, StreamingText } from './typing-indicator';
import { documentService, createDocumentFromResponse, AIDocument } from '@/lib/document-service';
import { ConvoAgent } from '@/lib/model-agents';
import { cn, formatAIResponseToParagraphs } from '@/lib/utils';
import { Button } from './button';

interface EnhancedChatMessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agent?: ConvoAgent;
  isTyping?: boolean;
  streamingSpeed?: number;
  onCopy?: () => void;
  onShare?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
  className?: string;
}

export function EnhancedChatMessage({
  id,
  content,
  role,
  timestamp,
  agent,
  isTyping = false,
  streamingSpeed = 30,
  onCopy,
  onShare,
  onRegenerate,
  onFeedback,
  className
}: EnhancedChatMessageProps) {
  const [document, setDocument] = useState<AIDocument | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [isStreamingComplete, setIsStreamingComplete] = useState(!isTyping);
  const [showActions, setShowActions] = useState(false);

  // Create document from AI response if it's substantial content
  useEffect(() => {
    if (role === 'assistant' && content.length > 200 && !isTyping) {
      const shouldCreateDocument = 
        content.includes('```') || // Contains code
        content.split('\n').length > 10 || // Multi-line content
        content.length > 500 || // Long content
        agent?.tag === '@codegen' || // Code generation agent
        agent?.tag === '@writer'; // Writing agent

      if (shouldCreateDocument) {
        const doc = createDocumentFromResponse(
          content,
          `${agent?.displayName || 'AI'} Response`,
          agent?.name
        );
        setDocument(doc);
      }
    }
  }, [content, role, isTyping, agent]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCreateDocument = () => {
    if (!document) {
      const doc = createDocumentFromResponse(
        content,
        `${agent?.displayName || 'AI'} Response`,
        agent?.name
      );
      setDocument(doc);
    }
    setShowDocument(true);
  };

  const handleShareDocument = () => {
    if (document) {
      const shareId = documentService.shareDocument(document.id, {
        allowEdit: true,
        expiresIn: 24 * 7 // 7 days
      });
      
      if (shareId) {
        const shareUrl = documentService.getShareUrl(shareId);
        navigator.clipboard.writeText(shareUrl);
        onShare?.();
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowTypingIndicator = isTyping && content.length === 0;
  const shouldStreamText = isTyping && content.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative px-4 py-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Typing Indicator */}
      {shouldShowTypingIndicator && (
        <TypingIndicator
          isVisible={true}
          message={`${agent?.displayName || 'AI'} is thinking...`}
          avatar={
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          }
        />
      )}

      {/* Main Message */}
      {content.length > 0 && (
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {role === 'user' ? (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                agent?.color || "bg-gradient-to-br from-blue-500 to-purple-600"
              )}>
                {agent ? (
                  agent.tag.slice(1, 3).toUpperCase()
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {role === 'user' ? 'You' : (agent?.displayName || 'AI')}
              </span>
              {agent && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {agent.tag}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(timestamp)}
              </span>
            </div>

            {/* Message Text */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {shouldStreamText ? (
                <StreamingText
                  text={content}
                  speed={streamingSpeed}
                  onComplete={() => setIsStreamingComplete(true)}
                  className="whitespace-pre-wrap"
                />
              ) : (
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: formatAIResponseToParagraphs(content) 
                  }}
                />
              )}
            </div>

            {/* Document Preview */}
            {document && showDocument && (
              <div className="mt-4">
                <AIDocumentViewer
                  document={document}
                  isTyping={!isStreamingComplete}
                  onShare={handleShareDocument}
                  onEdit={(newContent) => {
                    documentService.updateDocument(document.id, { content: newContent });
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <AnimatePresence>
              {(showActions || !isStreamingComplete) && role === 'assistant' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 mt-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>

                  {document ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDocument(!showDocument)}
                      className="text-xs"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {showDocument ? 'Hide' : 'View'} Document
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateDocument}
                      className="text-xs"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Create Document
                    </Button>
                  )}

                  {document && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareDocument}
                      className="text-xs"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>

                  {/* Feedback Buttons */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback?.('up')}
                      className="w-8 h-8 p-0"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedback?.('down')}
                      className="w-8 h-8 p-0"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
} 