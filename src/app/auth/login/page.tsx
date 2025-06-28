"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConvoAILogo } from '@/components/ui/convoai-logo';
import { sessionKeyService } from '@/lib/session-key-service';
import { 
  Wallet, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'connecting' | 'authorizing' | 'complete'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected
    const walletConnected = localStorage.getItem('wallet-connected') === 'true';
    if (walletConnected) {
      const address = localStorage.getItem('wallet-public-key');
      if (address) {
        setWalletAddress(address);
        // Check if session key exists
        const hasSession = sessionKeyService.hasValidSessionKey(address);
        console.log('[Login] Checking for valid session key:', hasSession, address);
        if (hasSession) {
          setConnectionStep('complete');
        } else {
          setConnectionStep('authorizing');
        }
      }
    }
  }, []);

  const connectWallet = async () => {
    console.log('[Login] Starting wallet connection...');
    setIsConnecting(true);
    setError(null);
    setConnectionStep('connecting');

    try {
      // Check if Phantom is installed
      if (!window.solana || !window.solana.isPhantom) {
        console.error('[Login] Phantom wallet not installed');
        throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
      }
      console.log('[Login] Phantom wallet is installed');

      // Connect to wallet
      console.log('[Login] Connecting to wallet...');
      const response = await window.solana.connect();
      const publicKey = response.publicKey.toString();

      console.log('[Login] Wallet connected successfully:', publicKey);

      // Store wallet info in localStorage or session
      localStorage.setItem('wallet-connected', 'true');
      localStorage.setItem('wallet-public-key', publicKey);
      // Store member since and last login
      const now = new Date().toISOString();
      if (!localStorage.getItem('wallet-member-since')) {
        localStorage.setItem('wallet-member-since', now);
      }
      localStorage.setItem('wallet-last-login', now);

      setWalletAddress(publicKey);
      setConnectionStep('authorizing');

      // Check if session key already exists
      console.log('[Login] Checking for existing session key...');
      const hasSession = sessionKeyService.hasValidSessionKey(publicKey);
      console.log('[Login] Session key exists after connect:', hasSession);
      if (hasSession) {
        console.log('[Login] Valid session key found, skipping authorization');
        setConnectionStep('complete');
        return;
      }

      // Request session key authorization
      console.log('[Login] No valid session key found, requesting authorization...');
      await requestSessionKeyAuthorization(publicKey);

    } catch (err) {
      console.error('[Login] Wallet connection error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setConnectionStep('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const requestSessionKeyAuthorization = async (address: string) => {
    console.log('[Login] Starting session key authorization for:', address);
    setIsAuthorizing(true);
    setError(null);

    try {
      // Create authorization message
      const scope = ['chat:write', 'chat:read', 'chat:delete'];
      const message = sessionKeyService.createAuthorizationMessage(address, scope);
      console.log('[Login] Authorization message created:', message);

      console.log('[Login] Requesting session key authorization for:', address);

      // Check if solana is available
      if (!window.solana) {
        console.error('[Login] Phantom wallet not available');
        throw new Error('Phantom wallet not available');
      }
      console.log('[Login] Phantom wallet is available');

      // Request signature from wallet
      const encodedMessage = new TextEncoder().encode(message);
      console.log('[Login] Requesting signature for message...');
      let signedMessage;
      try {
        signedMessage = await (window.solana as any).signMessage(encodedMessage, 'utf8');
        console.log('[Login] Message signed successfully:', signedMessage.signature);
      } catch (signError) {
        console.error('[Login] User rejected signature or error:', signError);
        setError('Signature was rejected or failed. Please try again.');
        setConnectionStep('idle');
        return;
      }

      // Verify the signature
      console.log('[Login] Verifying signature...');
      let isValid = false;
      try {
        isValid = await sessionKeyService.verifyAuthorization(
          address,
          signedMessage.signature.toString(),
          message
        );
        console.log('[Login] Signature verification result:', isValid);
      } catch (verifyError) {
        console.error('[Login] Signature verification error:', verifyError);
        setError('Signature verification failed. Please try again.');
        setConnectionStep('idle');
        return;
      }

      if (!isValid) {
        console.error('[Login] Invalid signature');
        setError('Invalid signature. Please try again.');
        setConnectionStep('idle');
        return;
      }

      // Create session key
      console.log('[Login] Creating session key...');
      try {
        await sessionKeyService.createSessionKey({
          walletAddress: address,
          scope,
          expiresIn: 7 // 7 days
        });
        console.log('[Login] Session key created successfully for:', address);
        // Log localStorage for debugging
        console.log('[Login] localStorage after session key:', Object.keys(localStorage));
      } catch (createError) {
        console.error('[Login] Failed to create session key:', createError);
        setError('Failed to create session key. Please try again.');
        setConnectionStep('idle');
        return;
      }

      console.log('[Login] Authorization completed successfully');
      setConnectionStep('complete');

      // Redirect to convocore after a short delay
      setTimeout(() => {
        router.push('/convocore');
      }, 2000);

    } catch (err) {
      console.error('[Login] Session key authorization error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setConnectionStep('idle');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleContinue = () => {
    if (connectionStep === 'complete') {
      router.push('/convocore');
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'connecting':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'authorizing':
        return <Shield className="w-5 h-5" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getStepText = (step: string) => {
    switch (step) {
      case 'connecting':
        return 'Connecting to wallet...';
      case 'authorizing':
        return 'Authorizing chat access...';
      case 'complete':
        return 'Ready to chat!';
      default:
        return 'Connect your wallet';
    }
  };

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'connecting':
        return 'Establishing secure connection to your Phantom wallet';
      case 'authorizing':
        return 'Signing authorization for automatic chat storage (one-time only)';
      case 'complete':
        return 'Your wallet is connected and authorized for seamless chat experience';
      default:
        return 'Connect your Solana wallet to start chatting with AI';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center justify-center mx-auto">
        {/* Logo and Welcome Message */}
        <div className="flex flex-col items-center justify-center mb-8 w-full">
          <ConvoAILogo className="mb-4" orientation="vertical" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Welcome to ConvoAI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Connect your wallet to start chatting
          </p>
        </div>

        {/* Connection Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm w-full">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              {getStepIcon(connectionStep)}
              {getStepText(connectionStep)}
            </CardTitle>
            <CardDescription>
              {getStepDescription(connectionStep)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Connection Steps */}
            <div className="space-y-3">
              {/* Step 1: Connect Wallet */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                connectionStep === 'idle' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                connectionStep === 'connecting' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  connectionStep === 'idle' ? 'bg-gray-300 dark:bg-gray-600' :
                  connectionStep === 'connecting' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}>
                  {connectionStep === 'connecting' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : connectionStep === 'idle' ? (
                    <span className="text-xs text-gray-600 dark:text-gray-400">1</span>
                  ) : (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Connect Wallet</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {walletAddress ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect your Phantom wallet'}
                  </div>
                </div>
              </div>

              {/* Step 2: Authorize Session */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                connectionStep === 'authorizing' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                connectionStep === 'complete' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  connectionStep === 'authorizing' ? 'bg-blue-500' :
                  connectionStep === 'complete' ? 'bg-green-500' :
                  'bg-gray-300 dark:bg-gray-600'
                }`}>
                  {connectionStep === 'authorizing' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : connectionStep === 'complete' ? (
                    <CheckCircle className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Authorize Chat Access</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {connectionStep === 'authorizing' ? 'Signing authorization message...' :
                     connectionStep === 'complete' ? 'Authorized for 7 days' :
                     'One-time authorization for seamless chat'}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {connectionStep === 'idle' && (
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Phantom Wallet
                    </>
                  )}
                </Button>
              )}

              {connectionStep === 'connecting' && (
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </Button>
              )}

              {connectionStep === 'authorizing' && (
                <Button
                  disabled={isAuthorizing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authorizing...
                </Button>
              )}

              {connectionStep === 'complete' && (
                <Button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Start Chatting
                </Button>
              )}
            </div>

            {/* Session Key Info */}
            {connectionStep === 'complete' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-400">
                    Session Key Active
                  </span>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Your chat messages will be stored automatically on Solana for the next 7 days. No more transaction popups!
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">AI-Powered Chat</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Advanced AI models for intelligent conversations</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-sm">Secure Storage</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Your chats stored securely on Solana blockchain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 