// Speech Recognition Service
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export class SpeechService {
  private recognition: ISpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isSupported = false;
  private isMobile = false;
  private isListening = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for speech recognition support
    if (typeof window !== 'undefined') {
      // Detect mobile devices
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
        this.isSupported = true;
      }

      // Check for speech synthesis support
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Mobile-optimized settings
    this.recognition.continuous = !this.isMobile; // On mobile, use single-shot recognition
    this.recognition.interimResults = true;
    // Set recognition language to the browser's preferred locale for automatic international language support
    const browserLang = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || 'en-US';
    this.recognition.lang = browserLang;
    
    this.recognition.maxAlternatives = 1;
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  public isSpeechSynthesisSupported(): boolean {
    return this.synthesis !== null;
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // More explicit permission request for mobile
        const constraints = { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(this.isMobile && {
              sampleRate: 16000,
              channelCount: 1
            })
          } 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Close the stream immediately as we only needed to check permissions
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  public async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported on this device');
      return;
    }

    if (this.isListening) {
      console.log('Already listening, stopping previous session');
      this.recognition.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Enhanced security and compatibility checks
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure && !this.isMobile) {
        onError('Speech recognition requires HTTPS. Please use a secure connection.');
        return;
      }

      // Mobile devices might work on HTTP in some cases, so let's try anyway
      if (!isSecure && this.isMobile) {
        console.warn('Using speech recognition on non-HTTPS mobile connection - may not work');
      }
    }

    try {
      // Request microphone permission first with retry
      let hasPermission = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!hasPermission && retryCount < maxRetries) {
        try {
          hasPermission = await this.requestMicrophonePermission();
          if (!hasPermission) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        } catch (error) {
          retryCount++;
        }
      }

      if (!hasPermission) {
        onError('Microphone permission denied. Please enable microphone access in your browser settings and refresh the page.');
        return;
      }
    } catch (permissionError) {
      onError('Failed to access microphone. Please check your permissions and try again.');
      return;
    }

    // Reset recognition
    try {
      this.recognition.abort();
    } catch (abortError) {
      // Ignore abort errors
    }

    // Mobile-specific: Add small delay before starting
    if (this.isMobile) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      const fullTranscript = finalTranscript || interimTranscript;
      const isFinal = finalTranscript.length > 0;
      
      if (fullTranscript.trim()) {
        onResult(fullTranscript, isFinal);
      }

      // On mobile, automatically restart if we got a final result but want continuous
      if (this.isMobile && isFinal && this.isListening) {
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start();
            } catch (error) {
              console.log('Could not restart speech recognition:', error);
            }
          }
        }, 100);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      let userFriendlyError = '';
      switch (event.error) {
        case 'not-allowed':
          userFriendlyError = 'Microphone access denied. Please enable microphone permissions in your browser settings and try again.';
          break;
        case 'no-speech':
          userFriendlyError = 'No speech detected. Please speak clearly and try again.';
          break;
        case 'audio-capture':
          userFriendlyError = 'No microphone found. Please check your microphone connection and try again.';
          break;
        case 'network':
          userFriendlyError = 'Network error occurred. Please check your internet connection and try again.';
          break;
        case 'service-not-allowed':
          userFriendlyError = 'Speech recognition service not allowed. Please use HTTPS or enable permissions.';
          break;
        case 'aborted':
          userFriendlyError = 'Speech recognition was stopped.';
          break;
        case 'bad-grammar':
          userFriendlyError = 'Speech recognition grammar error.';
          break;
        default:
          userFriendlyError = `Speech recognition error: ${event.error}. Please try again.`;
      }
      
      onError(userFriendlyError);
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      onError('Failed to start speech recognition. Please try again or check your microphone settings.');
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Dynamically update the recognition language.
   * @param lang BCP-47 language tag, e.g., "ko-KR", "es-ES".
   */
  public setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): void {
    if (!this.synthesis) {
      onError?.('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings with mobile optimizations
    utterance.rate = this.isMobile ? 0.8 : 0.9; // Slightly slower on mobile
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to use a natural-sounding voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('Speech synthesis started');
      onStart?.();
    };

    utterance.onend = () => {
      console.log('Speech synthesis ended');
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      onError?.(event.error || 'Speech synthesis failed');
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

// Create a singleton instance
export const speechService = new SpeechService(); 