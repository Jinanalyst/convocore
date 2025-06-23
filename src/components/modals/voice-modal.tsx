"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTranscriptComplete?: (transcript: string) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

export function VoiceModal({ open, onOpenChange, onTranscriptComplete }: VoiceModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Generate particles for ambient effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 400,
          y: Math.random() * 400,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          velocity: {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
          }
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.velocity.x + 400) % 400,
        y: (particle.y + particle.velocity.y + 400) % 400,
        opacity: Math.max(0.1, Math.min(0.4, particle.opacity + (Math.random() - 0.5) * 0.02))
      })));
      animationRef.current = requestAnimationFrame(animateParticles);
    };

    if (open) {
      animationRef.current = requestAnimationFrame(animateParticles);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open]);

  // Timer and waveform simulation
  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        
        // Simulate audio waveform
        const newWaveform = Array(32).fill(0).map(() => 
          Math.random() * (isListening ? 100 : 20)
        );
        setWaveformData(newWaveform);
        
        // Simulate volume changes
        const newVolume = Math.random() * 100;
        setVolume(newVolume);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setWaveformData(Array(32).fill(0));
      setVolume(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isListening]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart;
            } else {
              interimTranscript += transcriptPart;
            }
          }

          setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Initialize media recorder for audio recording
  useEffect(() => {
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioChunksRef.current = [];
          console.log('Audio recording completed:', audioBlob);
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access denied');
      }
    };

    if (open) {
      initMediaRecorder();
    }
  }, [open]);

  const handleToggleListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      
      // Process the transcript
      if (transcript.trim()) {
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          onTranscriptComplete?.(transcript.trim());
          handleClose();
        }, 1500);
      }
    } else {
      // Start listening
      try {
        setTranscript("");
        setError(null);
        setDuration(0);
        
        recognitionRef.current.start();
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.start();
        }
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start speech recognition');
      }
    }
  };

  const handleClose = () => {
    // Stop all recording
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Reset state
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setTranscript("");
    setDuration(0);
    setError(null);
    
    onOpenChange?.(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (error) return error;
    if (isListening) return "Listening...";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return "Speaking...";
    return "Tap to speak";
  };

  const getStatusColor = () => {
    if (error) return "text-red-400";
    if (isListening) return "text-blue-400";
    if (isProcessing) return "text-yellow-400";
    if (isSpeaking) return "text-green-400";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0 bg-transparent border-none shadow-none">
        <div className="relative flex flex-col items-center justify-center min-h-[600px] bg-background/95 backdrop-blur-sm rounded-2xl border border-border overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors z-20"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Ambient particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 bg-primary/20 rounded-full"
                style={{
                  left: particle.x,
                  top: particle.y,
                  opacity: particle.opacity
                }}
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Background glow effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"
              animate={{
                scale: isListening ? [1, 1.2, 1] : [1, 1.1, 1],
                opacity: isListening ? [0.3, 0.6, 0.3] : [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-6 px-6">
            {/* Main voice button */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.button
                onClick={handleToggleListening}
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-primary/20 to-primary/10 border-2",
                  isListening ? "border-blue-500 shadow-lg shadow-blue-500/25" :
                  isProcessing ? "border-yellow-500 shadow-lg shadow-yellow-500/25" :
                  isSpeaking ? "border-green-500 shadow-lg shadow-green-500/25" :
                  error ? "border-red-500 shadow-lg shadow-red-500/25" :
                  "border-border hover:border-primary/50"
                )}
                animate={{
                  boxShadow: isListening 
                    ? ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)"]
                    : undefined
                }}
                transition={{
                  duration: 1.5,
                  repeat: isListening ? Infinity : 0
                }}
                disabled={!!error}
              >
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </motion.div>
                  ) : isSpeaking ? (
                    <motion.div
                      key="speaking"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Volume2 className="w-8 h-8 text-green-500" />
                    </motion.div>
                  ) : isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Mic className="w-8 h-8 text-blue-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Mic className="w-8 h-8 text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Pulse rings */}
              <AnimatePresence>
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500/20"
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.5
                      }}
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Waveform visualizer */}
            <div className="flex items-center justify-center space-x-1 h-12">
              {waveformData.map((height, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "w-1 rounded-full transition-colors duration-300",
                    isListening ? "bg-blue-500" :
                    isProcessing ? "bg-yellow-500" :
                    isSpeaking ? "bg-green-500" :
                    "bg-muted"
                  )}
                  animate={{
                    height: `${Math.max(4, height * 0.4)}px`,
                    opacity: isListening || isSpeaking ? 1 : 0.3
                  }}
                  transition={{
                    duration: 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            {/* Status and timer */}
            <div className="text-center space-y-2">
              <motion.p
                className={cn("text-base font-medium transition-colors", getStatusColor())}
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{
                  duration: 2,
                  repeat: isListening || isProcessing || isSpeaking ? Infinity : 0
                }}
              >
                {getStatusText()}
              </motion.p>
              
              <p className="text-sm text-muted-foreground font-mono">
                {formatTime(duration)}
              </p>

              {volume > 0 && (
                <motion.div
                  className="flex items-center justify-center space-x-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <VolumeX className="w-3 h-3 text-muted-foreground" />
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      animate={{ width: `${volume}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                </motion.div>
              )}
            </div>

            {/* Transcript display */}
            {transcript && (
              <motion.div
                className="max-w-sm p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm text-gray-900 dark:text-white text-center">
                  "{transcript}"
                </p>
              </motion.div>
            )}

            {/* AI indicator */}
            <motion.div
              className="flex items-center space-x-2 text-xs text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Voice Assistant</span>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 