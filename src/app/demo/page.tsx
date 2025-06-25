"use client";

import { useState, useEffect } from "react";
import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { VoiceModal } from "@/components/modals/voice-modal";
import { Button } from "@/components/ui/button";
import { Mic, Upload } from "lucide-react";
import { isMobileDevice, getDeviceType, isWalletBrowser } from '@/lib/mobile-utils';

export default function DemoPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);
  const [walletTestResults, setWalletTestResults] = useState<Record<string, { connected: boolean; address?: string; error?: string }>>({});
  const [kakaoTestResult, setKakaoTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    deviceType: string;
    isWalletBrowser: { isWallet: boolean; walletName?: string };
  } | null>(null);

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

  useEffect(() => {
    // Check device information
    setDeviceInfo({
      isMobile: isMobileDevice(),
      deviceType: getDeviceType(),
      isWalletBrowser: isWalletBrowser()
    });
  }, []);

  const testWalletConnection = async (walletId: string) => {
    try {
      setWalletTestResults(prev => ({ ...prev, [walletId]: { connected: false } }));
      
      let connected = false;
      let address = '';
      
      switch (walletId) {
        case 'tronlink':
          if ((window as any).tronLink) {
            const accounts = await (window as any).tronLink.request({ method: 'tron_requestAccounts' });
            if (accounts && accounts[0]) {
              connected = true;
              address = accounts[0];
            }
          }
          break;
        case 'metamask':
          if ((window as any).ethereum?.isMetaMask) {
            const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
              connected = true;
              address = accounts[0];
            }
          }
          break;
        case 'phantom':
          if ((window as any).solana?.isPhantom) {
            const response = await (window as any).solana.connect();
            if (response?.publicKey) {
              connected = true;
              address = response.publicKey.toString();
            }
          }
          break;
      }
      
      setWalletTestResults(prev => ({ 
        ...prev, 
        [walletId]: { connected, address: connected ? address : undefined } 
      }));
    } catch (error) {
      setWalletTestResults(prev => ({ 
        ...prev, 
        [walletId]: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' } 
      }));
    }
  };

  const testKakaoAuth = async () => {
    try {
      setKakaoTestResult(null);
      
      // This would simulate the Kakao auth flow
      // In practice, this would redirect to Kakao OAuth
      const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!isConfigured) {
        setKakaoTestResult({ 
          success: false, 
          error: 'Supabase not configured for Kakao authentication' 
        });
        return;
      }
      
      // Simulate successful test
      setKakaoTestResult({ 
        success: true 
      });
    } catch (error) {
      setKakaoTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
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

        {/* Device Information */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Device Information</h3>
          {deviceInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Device Type:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {deviceInfo.deviceType} {deviceInfo.isMobile ? '📱' : '💻'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Is Mobile:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {deviceInfo.isMobile ? 'Yes' : 'No'}
                </span>
              </div>
              {deviceInfo.isWalletBrowser.isWallet && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet Browser:</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {deviceInfo.isWalletBrowser.walletName}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading device information...</div>
          )}
        </div>

        {/* Wallet Connection Tests */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Wallet Connection Tests</h3>
          <div className="space-y-4">
            {['tronlink', 'metamask', 'phantom'].map((walletId) => (
              <div key={walletId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {walletId === 'tronlink' ? '🔗' : walletId === 'metamask' ? '🦊' : '👻'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {walletId}
                    </div>
                    {walletTestResults[walletId] && (
                      <div className="text-sm">
                        {walletTestResults[walletId].connected ? (
                          <span className="text-green-600 dark:text-green-400">
                            Connected: {walletTestResults[walletId].address?.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            {walletTestResults[walletId].error || 'Not connected'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => testWalletConnection(walletId)}
                  className="text-xs"
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Native Share API Tests */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Native Share API Tests</h3>
          <div className="space-y-4">
            {/* Web Share API Support */}
            <div className="p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">Web Share API Support</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  (typeof navigator !== 'undefined' && 'share' in navigator)
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}>
                  {(typeof navigator !== 'undefined' && 'share' in navigator) ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {deviceInfo?.isMobile 
                  ? 'Mobile devices typically support native sharing to apps like WhatsApp, Twitter, etc.'
                  : 'Desktop browsers may have limited or no Web Share API support. Will fallback to clipboard.'}
              </div>
            </div>

            {/* Share Test Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Share Demo Chat
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Test native share with a sample conversation
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    const { shareService } = await import('@/lib/share-service');
                    const success = await shareService.shareChat('demo_chat_123', 'AI Demo Conversation');
                    addTestResult(`Share test: ${success ? 'Success' : 'Failed/Fallback used'}`);
                  }}
                  className="text-xs"
                >
                  Test Share
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔗</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Copy Link Only
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Test clipboard functionality
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    const { shareService } = await import('@/lib/share-service');
                    const success = await shareService.shareChat('demo_chat_456', 'Clipboard Test', { 
                      platform: 'clipboard' 
                    });
                    addTestResult(`Clipboard test: ${success ? 'Link copied' : 'Failed'}`);
                  }}
                  className="text-xs"
                  variant="outline"
                >
                  Copy Link
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Force Native Share
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {deviceInfo?.isMobile ? 'Will show native share sheet' : 'Will fallback to clipboard'}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    const { shareService } = await import('@/lib/share-service');
                    const success = await shareService.shareChat('demo_chat_789', 'Native Share Test', { 
                      platform: 'native' 
                    });
                    addTestResult(`Native share test: ${success ? 'Success' : 'Fallback used'}`);
                  }}
                  className="text-xs"
                  variant="secondary"
                >
                  Native Share
                </Button>
              </div>
            </div>

            {/* Expected Behavior */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Expected Behavior:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {deviceInfo?.isMobile ? (
                  <>
                    <li>• <strong>Mobile:</strong> Should show native share sheet with apps like WhatsApp, Twitter, etc.</li>
                    <li>• <strong>Apps Available:</strong> SMS, Email, Social media, Notes, etc.</li>
                    <li>• <strong>Fallback:</strong> If share cancelled, copies link to clipboard</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>Desktop:</strong> Limited Web Share API support, will copy to clipboard</li>
                    <li>• <strong>Notification:</strong> Shows "Link copied to clipboard" message</li>
                    <li>• <strong>Modal:</strong> May open additional share options modal</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Kakao Authentication Test */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">KakaoTalk Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="text-lg">💬</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    KakaoTalk Login
                  </div>
                  <div className="text-sm">
                    <span className="text-yellow-600 dark:text-yellow-400">
                      Currently in maintenance mode
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Status:</strong> Under development & configuration
              <br />
              <strong>Mobile Support:</strong> {deviceInfo?.isMobile ? 'Ready for mobile deployment' : 'Desktop integration prepared'}
              <br />
              <strong>Timeline:</strong> Available once Supabase + Kakao Developer Console setup is complete
              <br />
              <strong>Alternatives:</strong> Google Login, Wallet Connection, or Magic Link available now
            </div>
          </div>
        </div>

        {/* Mobile-Specific Tests */}
        {deviceInfo?.isMobile && (
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Mobile-Specific Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Touch Interface:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Deep Links:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Supported</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">App Store Redirects:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Available</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Mobile Viewport:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Optimized</span>
              </div>
            </div>
          </div>
        )}

        {/* Cross-Platform Compatibility */}
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cross-Platform Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-medium text-gray-900 dark:text-white">Mobile</div>
              <div className="text-sm text-green-600 dark:text-green-400">Fully Supported</div>
            </div>
            <div className="text-center p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="text-2xl mb-2">💻</div>
              <div className="font-medium text-gray-900 dark:text-white">Desktop</div>
              <div className="text-sm text-green-600 dark:text-green-400">Fully Supported</div>
            </div>
            <div className="text-center p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-medium text-gray-900 dark:text-white">Web3</div>
              <div className="text-sm text-green-600 dark:text-green-400">Multi-Chain</div>
            </div>
          </div>
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