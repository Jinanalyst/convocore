"use client";

import { useState, useEffect } from 'react';
import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { ConvoAILogo } from "@/components/ui/convo-ai-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notificationService } from '@/lib/notification-service';
import { Bell, MessageSquare, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';

export default function DemoPage() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(Notification.permission);
    if (granted) {
      notificationService.notifySuccess('Permission Granted!', 'You will now receive notifications when chats are completed.');
    } else {
      notificationService.notifyError('Permission Denied', 'Please enable notifications in your browser settings.');
    }
  };

  const testChatNotification = () => {
    notificationService.notifyChatComplete(
      'AI Assistant Chat',
      'Here is a detailed response to your question about implementing notifications in a Next.js application. The system includes both browser notifications and toast messages...',
      'chat-123'
    );
  };

  const testSuccessNotification = () => {
    notificationService.notifySuccess(
      'File Uploaded Successfully',
      'Your document has been processed and is ready for analysis.'
    );
  };

  const testErrorNotification = () => {
    notificationService.notifyError(
      'Connection Failed',
      'Unable to connect to the AI service. Please check your internet connection and try again.'
    );
  };

  const testInfoNotification = () => {
    notificationService.notifyInfo(
      'New Feature Available',
      'Voice chat is now available! Click the microphone button to start a voice conversation.'
    );
  };

  const testMultipleNotifications = () => {
    setTimeout(() => testInfoNotification(), 0);
    setTimeout(() => testSuccessNotification(), 1000);
    setTimeout(() => testChatNotification(), 2000);
    setTimeout(() => testErrorNotification(), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <ConvoAILogo />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
                                  <Link href="/convocore">Chat</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild>
                                  <Link href="/convocore">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Demo Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI Input Component Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience our advanced AI input component with auto-resizing textarea, 
            model selection, and modern UI design.
          </p>
        </div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Try the AI Input Component
            </h2>
            
            <AIInputDemo 
              onSubmit={(message, model) => {
                alert(`Message: "${message}"\nModel: ${model}\n\nThis is a demo - in production this would send to your AI service.`);
              }}
              placeholder="Type your message here... Try typing a long message to see auto-resize!"
            />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Auto-Resize Textarea
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                The textarea automatically adjusts its height as you type, providing a smooth user experience.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Model Selection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose from multiple AI models including GPT-4, Claude 3, and Gemini Pro with a clean dropdown interface.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Keyboard Shortcuts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use Ctrl+Enter (or Cmd+Enter on Mac) to quickly submit messages without clicking the send button.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tool Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built-in buttons for file attachments, voice input, and web search functionality.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Modern Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clean, minimalist design that works perfectly in both light and dark themes.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                TypeScript Ready
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fully typed with TypeScript for better development experience and type safety.
              </p>
            </div>
          </div>

          {/* Integration Note */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Integration Complete ✅
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              The AI Input component has been successfully integrated into your ConvoAI platform. 
              It&apos;s now being used in the chat interface with full model selection and TRON payment integration.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                                  <Link href="/convocore">Try Live Chat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>

          {/* Notification System */}
          <div className="mt-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Notification System Demo
            </h2>
            
            {/* Permission Status */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border mb-8">
              <Bell className="w-5 h-5" />
              <span className="font-medium">
                Notification Permission: 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  permissionStatus === 'granted' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : permissionStatus === 'denied'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {permissionStatus}
                </span>
              </span>
              {permissionStatus !== 'granted' && (
                <Button 
                  onClick={requestNotificationPermission}
                  size="sm"
                  className="ml-2"
                >
                  Request Permission
                </Button>
              )}
            </div>

            {/* Test Buttons Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Chat Notification */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Chat Complete</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Simulates a chat response completion notification with action button
                </p>
                <Button onClick={testChatNotification} className="w-full">
                  Test Chat Notification
                </Button>
              </div>

              {/* Success Notification */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Success</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Shows a success notification with green accent color
                </p>
                <Button onClick={testSuccessNotification} variant="outline" className="w-full">
                  Test Success
                </Button>
              </div>

              {/* Error Notification */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Error</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Displays an error notification with red accent and longer duration
                </p>
                <Button onClick={testErrorNotification} variant="outline" className="w-full">
                  Test Error
                </Button>
              </div>

              {/* Info Notification */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Information</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Shows an informational notification with standard duration
                </p>
                <Button onClick={testInfoNotification} variant="outline" className="w-full">
                  Test Info
                </Button>
              </div>

              {/* Multiple Notifications */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Multiple Notifications</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Tests the notification queue system with multiple notifications appearing in sequence
                </p>
                <Button onClick={testMultipleNotifications} variant="outline" className="w-full">
                  Test Multiple Notifications
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">How to Test</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                  <p>First, grant notification permission by clicking "Request Permission" above</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                  <p>Click any test button to see toast notifications appear in the bottom-right corner</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                  <p>Switch to another tab or minimize the browser to see browser notifications (if permission granted)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                  <p>Click the bell icon in the header to view all notifications in the notifications modal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 