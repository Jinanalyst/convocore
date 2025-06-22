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
import { Paperclip, Mic, Search, Send } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
];

interface AIInputDemoProps {
  onSubmit?: (message: string, model: string) => void;
  placeholder?: string;
  className?: string;
}

export function AIInputDemo({ 
  onSubmit, 
  placeholder = "Ask ConvoAI anything...",
  className 
}: AIInputDemoProps) {
  const [model, setModel] = useState<string>(models[0].id);
  const [message, setMessage] = useState("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const messageText = formData.get('message') as string;
    
    if (messageText.trim()) {
      onSubmit?.(messageText, model);
      console.log('Submitted message:', messageText, 'Model:', model);
      
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
            <AIInputButton title="Attach file">
              <Paperclip size={16} />
            </AIInputButton>
            <AIInputButton title="Voice input">
              <Mic size={16} />
            </AIInputButton>
            <AIInputButton title="Web search">
              <Search size={16} />
              <span>Search</span>
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
    </div>
  );
} 