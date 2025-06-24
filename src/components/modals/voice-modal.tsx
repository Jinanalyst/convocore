"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  Send, 
  AlertCircle, 
  Smartphone,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { speechService } from "@/lib/speech-recognition";

interface VoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscriptComplete?: (transcript: string) => void;
}

export function VoiceModal({ open, onOpenChange, onTranscriptComplete }: VoiceModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check speech support
  useEffect(() => {
    const checkSupport = () => {
      const speechSupported = speechService.isSpeechRecognitionSupported();
      
      if (!speechSupported) {
        setIsSupported(false);
        setError('Speech recognition is not supported in this browser. Please try using Chrome, Safari, or Edge.');
      }
    };

    if (open && typeof window !== 'undefined') {
      checkSupport();
    }
  }, [open]);

  // Duration timer
  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isListening]);

  // Handle speech functions
  const handleStop = useCallback(() => {
    speechService.stopListening();
    setIsListening(false);
    setDuration(0);
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    setTranscript("");
    setDuration(0);
    setPermissionDenied(false);
    setIsProcessing(false);
    
    try {
      await speechService.startListening(
        (text: string, isFinal: boolean) => {
          setTranscript(text);
          if (isFinal && isMobile) {
            // On mobile, auto-stop after getting final result
            setTimeout(() => {
              if (text.trim()) {
                handleSubmit(text.trim());
              }
            }, 500);
          }
        },
        (error: string) => {
          console.error('Speech recognition error:', error);
          setError(error);
          setIsListening(false);
          
          if (error.includes('denied') || error.includes('not-allowed')) {
            setPermissionDenied(true);
          }
        },
        () => {
          setIsListening(true);
          setError(null);
        },
        () => {
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  }, [isMobile]);

  const handleSubmit = useCallback((text?: string) => {
    const finalText = text || transcript.trim();
    if (!finalText) {
      setError('No speech detected. Please try again.');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      onTranscriptComplete?.(finalText);
      handleClose();
    }, 500);
  }, [transcript, onTranscriptComplete]);

  const handleClose = useCallback(() => {
    handleStop();
    speechService.stopSpeaking();
    setTranscript("");
    setDuration(0);
    setError(null);
    setIsProcessing(false);
    setPermissionDenied(false);
    onOpenChange(false);
  }, [handleStop, onOpenChange]);

  const handleRetry = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);
    setTranscript("");
    await handleStart();
  }, [handleStart]);

  const handleToggleListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      handleStop();
    } else {
      await handleStart();
    }
  }, [isSupported, isListening, handleStop, handleStart]);

  // Clean up on modal close
  useEffect(() => {
    if (!open) {
      speechService.stopListening();
      setTranscript("");
      setDuration(0);
      setError(null);
      setPermissionDenied(false);
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (isProcessing) return "Processing...";
    if (isListening) return isMobile ? "Listening... (will auto-stop)" : "Listening... Click stop when done";
    if (transcript) return "Ready to send";
    return "Click to start speaking";
  };

  const getStatusColor = () => {
    if (error) return "text-red-500";
    if (isProcessing) return "text-blue-500";
    if (isListening) return "text-green-500";
    if (transcript) return "text-blue-500";
    return "text-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md mx-auto",
        isMobile && "w-[95vw] h-[90vh] max-h-[600px] flex flex-col"
      )}>
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">Voice Input</DialogTitle>
        </DialogHeader>

        <div className={cn(
          "flex flex-col items-center space-y-6 py-4",
          isMobile && "flex-1 justify-center"
        )}>
          {/* Error Display */}
          {error && (
            <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  
                  {permissionDenied && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        To use voice input:
                      </p>
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4">
                        <li>• Click the microphone icon in your browser's address bar</li>
                        <li>• Select "Allow" for microphone access</li>
                        <li>• Refresh the page if needed</li>
                        {isMobile && <li>• Ensure you're using HTTPS or a supported browser</li>}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="mt-2"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!error && (
            <>
              {/* Microphone Button */}
              <div className="relative">
                <motion.button
                  onClick={handleToggleListening}
                  disabled={!isSupported || isProcessing}
                  className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                    isMobile && "w-24 h-24 touch-manipulation",
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                  whileHover={{ scale: isSupported && !isProcessing ? 1.05 : 1 }}
                  whileTap={{ scale: isSupported && !isProcessing ? 0.95 : 1 }}
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : isListening ? (
                    <MicOff className={isMobile ? "w-8 h-8" : "w-6 h-6"} />
                  ) : (
                    <Mic className={isMobile ? "w-8 h-8" : "w-6 h-6"} />
                  )}
                </motion.button>

                {/* Recording indicator */}
                {isListening && (
                  <motion.div
                    className="pointer-events-none absolute -inset-2 rounded-full border-2 border-red-500"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Status and Timer */}
              <div className="text-center space-y-2">
                <p className={cn("text-sm font-medium", getStatusColor())}>
                  {getStatusText()}
                </p>
                
                {(isListening || duration > 0) && (
                  <div className="text-2xl font-mono text-gray-900 dark:text-white">
                    {formatTime(duration)}
                  </div>
                )}
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {transcript}
                  </p>
                </div>
              )}

              {/* Mobile-specific tips */}
              {isMobile && !isListening && !transcript && (
                <div className="text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tap the microphone and speak clearly
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Recognition will stop automatically when you finish speaking
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {transcript && !isListening && !isProcessing && (
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setTranscript("")}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={!transcript.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 