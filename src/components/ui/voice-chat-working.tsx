"use client";

import { Mic, Volume2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceChatProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onVolumeChange?: (volume: number) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSubmit?: (text: string) => void;
  selectedModel?: string;
  className?: string;
  demoMode?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

export function VoiceChat({
  onStart,
  onStop,
  onVolumeChange,
  onTranscript,
  onSubmit,
  selectedModel = 'gpt-4o',
  className,
  demoMode = false
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError('Speech recognition not supported in this browser');
      }
    }
  }, []);

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
        opacity: particle.opacity + (Math.random() - 0.5) * 0.02
      })));
      animationRef.current = requestAnimationFrame(animateParticles);
    };

    animationRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Timer and waveform
  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        
        const newWaveform = Array(32).fill(0).map(() => 
          Math.random() * (isListening ? 100 : 20)
        );
        setWaveformData(newWaveform);
        
        const newVolume = Math.random() * 100;
        setVolume(newVolume);
        onVolumeChange?.(newVolume);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setWaveformData(Array(32).fill(0));
      setVolume(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isListening, onVolumeChange]);

  const startListening = () => {
    if (!isSupported) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onStart?.();
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      onTranscript?.(currentTranscript, !!finalTranscript);
      
      if (finalTranscript) {
        setIsListening(false);
        setIsProcessing(true);
        onStop?.(duration);
        
        setTimeout(() => {
          onSubmit?.(finalTranscript);
          setTranscript("");
          setDuration(0);
        }, 500);
      }
    };
    
    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
      setDuration(0);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onStop?.(duration);
    setDuration(0);
  };

  const handleToggleListening = () => {
    if (demoMode) return;
    
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return "Speaking...";
    return isSupported ? "Tap to speak" : "Speech not supported";
  };

  const getStatusColor = () => {
    if (isListening) return "text-blue-400";
    if (isProcessing) return "text-yellow-400";
    if (isSpeaking) return "text-green-400";
    if (!isSupported) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden", className)}>
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

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Main voice button */}
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.button
            onClick={handleToggleListening}
            disabled={!isSupported}
            className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
              "bg-gradient-to-br from-primary/20 to-primary/10 border-2",
              isListening ? "border-blue-500 shadow-lg shadow-blue-500/25" :
              isProcessing ? "border-yellow-500 shadow-lg shadow-yellow-500/25" :
              isSpeaking ? "border-green-500 shadow-lg shadow-green-500/25" :
              !isSupported ? "border-red-500/50 opacity-50 cursor-not-allowed" :
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
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                </motion.div>
              ) : isSpeaking ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Volume2 className="w-12 h-12 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic className={cn(
                    "w-12 h-12",
                    isListening ? "text-blue-500" :
                    !isSupported ? "text-red-400" :
                    "text-muted-foreground"
                  )} />
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
        <div className="flex items-center justify-center space-x-1 h-16">
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
                height: `${Math.max(4, height * 0.6)}px`,
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
        <div className="text-center space-y-4">
          <motion.p
            className={cn("text-lg font-medium transition-colors", getStatusColor())}
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

          {/* Live transcript display */}
          {transcript && (
            <motion.div
              className="max-w-md mx-auto p-4 bg-muted/20 rounded-lg border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm text-foreground">
                "{transcript}"
                {isListening && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />}
              </p>
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <motion.div
              className="max-w-md mx-auto p-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 flex items-center space-x-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </div>

        {/* AI indicator with model name */}
        <motion.div
          className="flex flex-col items-center space-y-2 text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Voice Assistant</span>
          </div>
          <div className="text-xs px-2 py-1 bg-primary/10 rounded-full border">
            {(() => {
              const modelNames: { [key: string]: string } = {
                'gpt-4o': 'Convocore Omni',
                'gpt-4-turbo': 'Convocore Turbo',
                'claude-3-opus-20240229': 'Convocore Alpha',
                'claude-3-sonnet-20240229': 'Convocore Nova'
              };
              return modelNames[selectedModel] || 'Convocore';
            })()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}