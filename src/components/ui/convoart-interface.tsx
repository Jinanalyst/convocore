"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Upload, Download, Copy, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convoArtService, ConvoArtResponse } from '@/lib/convoart-service';

interface ConvoArtInterfaceProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  className?: string;
}

export const ConvoArtInterface: React.FC<ConvoArtInterfaceProps> = ({
  onImageGenerated,
  className = "",
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ConvoArtResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate an image");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your DeepAI API key");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await convoArtService.generateImage({
        text: prompt,
        apiKey: apiKey,
      });

      if (result.status === 'error') {
        setError(result.error || 'Failed to generate image');
      } else {
        setGeneratedImage(result);
        onImageGenerated?.(result.output_url, prompt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!apiKey.trim()) {
      setError("Please enter your DeepAI API key");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await convoArtService.generateImageFromFile(file, apiKey);
      
      if (result.status === 'error') {
        setError(result.error || 'Failed to generate image from file');
      } else {
        setGeneratedImage(result);
        onImageGenerated?.(result.output_url, `Generated from file: ${file.name}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage?.output_url) return;

    try {
      const response = await fetch(generatedImage.output_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `convoart-${generatedImage.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyUrl = () => {
    if (generatedImage?.output_url) {
      navigator.clipboard.writeText(generatedImage.output_url);
    }
  };

  const handleShare = async () => {
    if (generatedImage?.output_url && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ConvoArt Generated Image',
          text: `Generated with prompt: ${prompt}`,
          url: generatedImage.output_url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ConvoArt</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Image Generation</p>
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            DeepAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your DeepAI API key"
            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your API key is stored locally and never sent to our servers
          </p>
        </div>

        {/* Prompt Input */}
        <div className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl"
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || !apiKey.trim()}
                variant="outline"
                className="px-6 py-3 rounded-xl border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700"
              >
                <Upload className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Generated Image Display */}
        {generatedImage && generatedImage.output_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-t border-gray-200 dark:border-zinc-700"
          >
            <div className="relative">
              <img
                src={generatedImage.output_url}
                alt="Generated by ConvoArt"
                className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg"
                onError={() => setError("Failed to load generated image")}
              />
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                
                {typeof navigator !== 'undefined' && navigator.share && (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 