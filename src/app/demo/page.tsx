"use client";

import { useState } from "react";
import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { VoiceModal } from "@/components/modals/voice-modal";
import { Button } from "@/components/ui/button";
import { Mic, Upload } from "lucide-react";

export default function DemoPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleMessage = (message: string, model: string, includeWebSearch?: boolean) => {
    setLastMessage(message);
    addTestResult(`✅ Message sent: "${message.substring(0, 50)}..." using ${model}`);
    console.log("Demo received message:", { message, model, includeWebSearch });
  };

  const handleFileUpload = (file?: File) => {
    if (file) {
      setUploadedFile(file);
      addTestResult(`✅ File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      console.log("Demo received file:", file);
    }
  };

  const handleVoiceInput = () => {
    setVoiceModalOpen(true);
    addTestResult("🎤 Voice modal opened");
  };

  const handleVoiceTranscriptComplete = (transcript: string) => {
    setVoiceTranscript(transcript);
    setLastMessage(transcript);
    addTestResult(`✅ Voice input received: "${transcript}"`);
    console.log("Demo received voice transcript:", transcript);
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testFileUpload = () => {
    // Create a test file
    const testFile = new File(["Hello, this is a test file content!"], "test.txt", {
      type: "text/plain"
    });
    handleFileUpload(testFile);
  };

  const clearResults = () => {
    setTestResults([]);
    setUploadedFile(null);
    setVoiceTranscript("");
    setLastMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mobile Upload & Voice Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test file upload and voice input functionality on mobile, tablet, and desktop
          </p>
        </div>

        {/* Test Results */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Test Results
            </h2>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear
            </Button>
          </div>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No tests run yet. Try uploading a file or using voice input below.
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-gray-50 dark:bg-zinc-800 rounded border-l-4 border-green-500"
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              📎 Last File Upload
            </h3>
            {uploadedFile ? (
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Name:</strong> {uploadedFile.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Size:</strong> {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Type:</strong> {uploadedFile.type}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No file uploaded yet
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              🎤 Last Voice Input
            </h3>
            {voiceTranscript ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                "{voiceTranscript}"
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No voice input yet
              </p>
            )}
          </div>
        </div>

        {/* Manual Test Buttons */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Manual Tests
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button onClick={testFileUpload} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Test File Upload
            </Button>
            <Button onClick={() => setVoiceModalOpen(true)} variant="outline">
              <Mic className="w-4 h-4 mr-2" />
              Test Voice Input
            </Button>
          </div>
        </div>

        {/* Main Demo Component */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Interactive Demo
          </h2>
          <AIInputDemo
            onSubmit={handleMessage}
            onFileUpload={handleFileUpload}
            onVoiceInput={handleVoiceInput}
            className="w-full"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            📱 Mobile Testing Instructions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>File Upload:</strong> Tap the paperclip icon to select files from your device</li>
            <li>• <strong>Voice Input:</strong> Tap the microphone icon and allow microphone permissions</li>
            <li>• <strong>HTTPS Required:</strong> Voice input requires secure connection (HTTPS)</li>
            <li>• <strong>Browser Support:</strong> Best experience in Chrome, Safari, or Edge</li>
            <li>• <strong>Mobile Optimization:</strong> Touch-friendly buttons with proper sizing</li>
          </ul>
        </div>
      </div>

      {/* Voice Modal */}
      <VoiceModal
        open={voiceModalOpen}
        onOpenChange={setVoiceModalOpen}
        onTranscriptComplete={handleVoiceTranscriptComplete}
      />
    </div>
  );
} 