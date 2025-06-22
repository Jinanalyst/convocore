"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceChat } from "@/components/ui/voice-chat-working";
import { cn } from "@/lib/utils";
import { speechService } from "@/lib/speech-recognition";
import { aiChatService } from "@/lib/ai-chat-service";
import { useState } from "react";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (message: string) => void;
  selectedModel?: string;
  className?: string;
}

export function VoiceModal({ isOpen, onClose, onSubmit, selectedModel = 'gpt-4o', className }: VoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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