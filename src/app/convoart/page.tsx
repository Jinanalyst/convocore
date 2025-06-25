"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ConvoArtInterface } from '@/components/ui/convoart-interface';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ConvoArtPage() {
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, prompt: string, timestamp: Date}>>([]);

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    setGeneratedImages(prev => [
      { url: imageUrl, prompt, timestamp: new Date() },
      ...prev.slice(0, 9) // Keep only the last 10 images
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Palette className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ConvoArt Studio</h1>
              <p className="text-gray-600 dark:text-gray-400">Transform your ideas into stunning visuals</p>
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 mb-8 shadow-xl border border-gray-200 dark:border-zinc-700"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">Advanced DeepAI technology for high-quality image generation</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Creative Freedom</h3>
              <p className="text-gray-600 dark:text-gray-400">Generate any style of artwork from detailed text descriptions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-sm">HD</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">High Quality</h3>
              <p className="text-gray-600 dark:text-gray-400">Professional-grade images ready for download and sharing</p>
            </div>
          </div>
        </motion.div>

        {/* Main Interface */}
        <ConvoArtInterface onImageGenerated={handleImageGenerated} />

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Creations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-zinc-700"
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {image.timestamp.toLocaleDateString()} at {image.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 