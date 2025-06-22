"use client";

import { X, Mic, AlertCircle, CheckCircle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceChat } from "@/components/ui/voice-chat-working";
import { cn } from "@/lib/utils";
import { speechService } from "@/lib/speech-recognition";
import { aiChatService } from "@/lib/ai-chat-service";
import { useState, useEffect } from "react";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (message: string) => void;
  selectedModel?: string;
  className?: string;
}

export function VoiceModal({ isOpen, onClose, onSubmit, selectedModel = 'gpt-4o', className }: VoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermission = await speechService.requestMicrophonePermission();
      setHasPermission(hasPermission);
      if (!hasPermission) {
        setPermissionError('Microphone access is required for voice features. Please allow microphone access and try again.');
      } else {
        setPermissionError(null);
      }
    } catch (error) {
      setHasPermission(false);
      setPermissionError('Unable to access microphone. Please check your browser settings.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={cn(
              "relative w-full h-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden",
              className
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Permission Status */}
            {(permissionError || hasPermission === false) && (
              <div className="absolute top-16 left-4 right-4 z-10">
                <motion.div
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-500 mb-2">Microphone Access Required</h3>
                      <p className="text-sm text-red-500/80 mb-3">
                        {permissionError || 'Please enable microphone permissions to use voice features.'}
                      </p>
                      <div className="text-xs text-red-500/70 space-y-1">
                        <p><strong>Chrome:</strong> Click the 🔒 icon in the address bar → Allow microphone</p>
                        <p><strong>Firefox:</strong> Click the microphone icon in the address bar → Allow</p>
                        <p><strong>Edge:</strong> Click the 🔒 icon → Microphone → Allow</p>
                      </div>
                      <button
                        onClick={checkPermissions}
                        className="mt-3 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {hasPermission === true && (
              <div className="absolute top-16 left-4 right-4 z-10">
                <motion.div
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">Microphone access granted</span>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Voice Chat Interface */}
            <VoiceChat
              selectedModel={selectedModel}
              onStart={() => console.log("Voice recording started")}
              onStop={(duration) => console.log(`Voice recording stopped after ${duration}s`)}
              onVolumeChange={(volume) => console.log(`Volume: ${volume}%`)}
              onTranscript={(text, isFinal) => {
                if (isFinal) {
                  console.log("Final transcript:", text);
                }
              }}
              onSubmit={async (text: string) => {
                console.log("Processing voice input:", text);
                setIsProcessing(true);
                
                try {
                  // Get AI response using the real API
                  const response = await aiChatService.submitToRealAI(text, selectedModel);
                  
                  // Speak the response using native Web Speech API
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(response);
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.volume = 0.8;
                    
                    utterance.onstart = () => {
                      console.log("Speaking AI response");
                    };
                    
                    utterance.onend = () => {
                      console.log("Finished speaking");
                      setIsProcessing(false);
                    };
                    
                    utterance.onerror = (error) => {
                      console.error("Speech error:", error);
                      setIsProcessing(false);
                    };
                    
                    speechSynthesis.speak(utterance);
                  } else {
                    console.log("Speech synthesis not supported");
                    setIsProcessing(false);
                  }
                  
                  // Also submit to parent component if needed
                  onSubmit?.(text);
                  
                } catch (error) {
                  console.error("Error processing voice input:", error);
                  setIsProcessing(false);
                }
              }}
              demoMode={false}
              className="h-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 