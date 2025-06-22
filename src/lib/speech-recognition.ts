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

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for speech recognition support
    if (typeof window !== 'undefined') {
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

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      onError('Speech recognition not supported');
      return;
    }

    // Check if we're on HTTPS or localhost
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        onError('Speech recognition requires HTTPS. Please use a secure connection.');
        return;
      }
    }

    try {
      // Request microphone permission first
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        onError('Microphone permission denied. Please enable microphone access and try again.');
        return;
      }
    } catch (permissionError) {
      onError('Failed to access microphone. Please check your permissions.');
      return;
    }

    // Reset recognition
    try {
      this.recognition.abort();
    } catch (abortError) {
      // Ignore abort errors
    }

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
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
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let userFriendlyError = '';
      switch (event.error) {
        case 'not-allowed':
          userFriendlyError = 'Microphone access denied. Please enable microphone permissions and try again.';
          break;
        case 'no-speech':
          userFriendlyError = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          userFriendlyError = 'No microphone found. Please check your microphone connection.';
          break;
        case 'network':
          userFriendlyError = 'Network error occurred. Please check your internet connection.';
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
          userFriendlyError = `Speech recognition error: ${event.error}`;
      }
      
      onError(userFriendlyError);
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError('Failed to start speech recognition. Please try again.');
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
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
    
    // Configure voice settings
    utterance.rate = 0.9;
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
}

// Create a singleton instance
export const speechService = new SpeechService(); 