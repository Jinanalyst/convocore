'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Share2, 
  Copy, 
  Download, 
  Edit3, 
  Save, 
  X, 
  ExternalLink,
  Code,
  FileCode,
  Image,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface AIDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'markdown' | 'html' | 'chart';
  language?: string;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AIDocumentViewerProps {
  document: AIDocument;
  isTyping?: boolean;
  typingSpeed?: number;
  onEdit?: (content: string) => void;
  onShare?: () => void;
  onSave?: (content: string) => void;
  className?: string;
}

export function AIDocumentViewer({
  document,
  isTyping = false,
  typingSpeed = 50,
  onEdit,
  onShare,
  onSave,
  className
}: AIDocumentViewerProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(document.content);
  const [isVisible, setIsVisible] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef<HTMLDivElement>(null);

  // Typing animation effect
  useEffect(() => {
    if (isTyping && document.content) {
      setDisplayContent('');
      setIsVisible(true);
      
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < document.content.length) {
          setDisplayContent(prev => prev + document.content[currentIndex]);
          currentIndex++;
          typingTimeoutRef.current = setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    } else {
      setDisplayContent(document.content);
      setIsVisible(true);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [document.content, isTyping, typingSpeed]);

  // Auto-scroll during typing
  useEffect(() => {
    if (isTyping && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayContent, isTyping]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, '_')}.${getFileExtension(document.type)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave?.(editContent);
    onEdit?.(editContent);
    setIsEditing(false);
  };

  const getFileExtension = (type: string) => {
    switch (type) {
      case 'code': return 'js';
      case 'markdown': return 'md';
      case 'html': return 'html';
      default: return 'txt';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-5 h-5" />;
      case 'html': return <FileCode className="w-5 h-5" />;
      case 'chart': return <BarChart3 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatContent = (content: string, type: string) => {
    switch (type) {
      case 'code':
        return (
          <pre className="language-javascript">
            <code className="text-sm">{content}</code>
          </pre>
        );
      case 'markdown':
        return (
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      case 'html':
        return (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        );
      default:
        return (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        );
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden",
          className
        )}
      >
        {/* Document Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {getDocumentIcon(document.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {document.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {document.type} • Created {document.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {document.isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>

              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="text-xs"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="relative">
          {isEditing ? (
            <div className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Edit your content..."
              />
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="p-6 max-h-96 overflow-y-auto"
            >
              {formatContent(displayContent, document.type)}
              
              {/* Typing Cursor */}
              {isTyping && displayContent.length < document.content.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-0.5 h-4 bg-blue-500 ml-1"
                />
              )}
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
              <span className="ml-1">AI is typing...</span>
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {displayContent.split('\n').length} lines • {displayContent.length} characters
            </span>
            <span>
              Last updated: {document.updatedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 