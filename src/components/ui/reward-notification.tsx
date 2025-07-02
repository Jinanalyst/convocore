import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './badge';
import { Sparkles, Coins } from 'lucide-react';

interface RewardNotificationProps {
  reward: {
    success: boolean;
    userRewardAmount: number;
    burnAmount: number;
    userRewardTx?: string;
    burnTx?: string;
    conversationLength: number;
  };
  isVisible: boolean;
  onClose: () => void;
}

export function RewardNotification({ reward, isVisible, onClose }: RewardNotificationProps) {
  if (!reward || !reward.success) return null;

  // Convert from base units (6 decimals) to display units
  const userRewardDisplay = reward.userRewardAmount / Math.pow(10, 6);
  const burnDisplay = reward.burnAmount / Math.pow(10, 6);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg p-4 border border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <Coins className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <div className="font-semibold text-sm">🎉 You earned CONVO tokens!</div>
                  <div className="text-xs opacity-90">
                    +{userRewardDisplay.toFixed(2)} CONVO for chatting
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-2 text-xs opacity-80">
              <div>Conversation: {reward.conversationLength} characters</div>
              <div>Burned: {burnDisplay.toFixed(2)} CONVO (10%)</div>
              {reward.userRewardTx && (
                <div className="truncate">
                  TX: {reward.userRewardTx.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 