'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  avatar?: React.ReactNode;
  className?: string;
}

export function TypingIndicator({ 
  isVisible, 
  message = "AI is typing...", 
  avatar,
  className 
}: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatar || (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Typing Bubble */}
      <div className="flex-1 max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            {/* Animated Dots */}
            <div className="flex gap-1">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  delay: 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  delay: 0.4,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
              />
            </div>
            
            {/* Typing Message */}
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {message}
            </span>
          </div>
        </motion.div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1"
        >
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </motion.div>
      </div>
    </motion.div>
  );
}

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({ 
  text, 
  speed = 30, 
  onComplete, 
  className 
}: StreamingTextProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <div className={className}>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5"
        />
      )}
    </div>
  );
} 