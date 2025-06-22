"use client";

import {
  AIInput,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools
} from "@/components/ui/ai-input";
import { VoiceModal } from "@/components/modals/voice-modal";
import { Paperclip, Mic, Search, Send } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

const models = [
  { id: 'gpt-4o', name: 'Convocore Omni', description: 'Flagship model, multimodal, high performance' },
  { id: 'gpt-4-turbo', name: 'Convocore Turbo', description: 'High-speed response + quality balance' },
  { id: 'claude-3-opus-20240229', name: 'Convocore Alpha', description: 'Most precise reasoning, advanced analysis' },
  { id: 'claude-3-sonnet-20240229', name: 'Convocore Nova', description: 'Balanced performance, practical daily tasks' },
];

interface AIInputDemoProps {
  onSubmit?: (message: string, model: string, includeWebSearch?: boolean) => void;
  onFileUpload?: (file: File) => void;
  onVoiceInput?: () => void;
  placeholder?: string;
  className?: string;
}

export function AIInputDemo({ 
  onSubmit, 
  onFileUpload,
  onVoiceInput,
  placeholder = "Ask ConvoAI anything...",
  className 
}: AIInputDemoProps) {
  const [model, setModel] = useState<string>(models[0].id);
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleVoiceInput = () => {
    setIsVoiceModalOpen(true);
    if (onVoiceInput) {
      onVoiceInput();
    }
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const messageText = formData.get('message') as string;
    
    if (messageText.trim()) {
      onSubmit?.(messageText, model, webSearchEnabled);
      console.log('Submitted message:', messageText, 'Model:', model, 'Web search:', webSearchEnabled);
      
      // Reset the form
      setMessage("");
      // Reset textarea height
      const textarea = event.currentTarget.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '48px';
      }
    }
  };

  return (
    <div className={className}>
      <AIInput onSubmit={handleSubmit}>
        <AIInputTextarea 
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minHeight={48}
          maxHeight={200}
        />
        <AIInputToolbar>
          <AIInputTools>
            <AIInputButton title="Attach file" onClick={() => document.getElementById('file-upload')?.click()}>
              <Paperclip size={16} />
            </AIInputButton>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <AIInputButton title="Voice input" onClick={handleVoiceInput}>
              <Mic size={16} />
            </AIInputButton>
            <AIInputButton 
              title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
              onClick={toggleWebSearch}
              className={webSearchEnabled ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""}
            >
              <Search size={16} />
              <span>{webSearchEnabled ? "Search On" : "Search"}</span>
            </AIInputButton>
            <AIInputModelSelect value={model} onValueChange={setModel}>
              <AIInputModelSelectTrigger>
                <AIInputModelSelectValue placeholder="Select model" />
              </AIInputModelSelectTrigger>
              <AIInputModelSelectContent>
                {models.map((modelOption) => (
                  <AIInputModelSelectItem key={modelOption.id} value={modelOption.id}>
                    {modelOption.name}
                  </AIInputModelSelectItem>
                ))}
              </AIInputModelSelectContent>
            </AIInputModelSelect>
          </AIInputTools>
          <AIInputSubmit 
            disabled={!message.trim()}
            title="Send message (Ctrl+Enter)"
          >
            <Send size={16} />
          </AIInputSubmit>
        </AIInputToolbar>
      </AIInput>
      
      {/* Voice Modal */}
      <VoiceModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedModel={model}
        onSubmit={(voiceText) => {
          // Add the voice transcript to the message input
          setMessage(voiceText);
          // Optionally auto-submit the voice message
          if (onSubmit && voiceText.trim()) {
            onSubmit(voiceText, model, webSearchEnabled);
          }
        }}
      />
    </div>
  );
} 