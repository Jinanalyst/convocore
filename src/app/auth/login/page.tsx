'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';
import { WalletConnector } from '@/components/ui/wallet-connector';
import { useAuth } from '@/lib/auth-context';
import { Chrome, Wallet, ArrowRight, AlertCircle } from 'lucide-react';

function LoginPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'google' | 'wallet' | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/convocore';
  const { signInWithGoogle, signInWithWallet } = useAuth();

  // Check for auth callback errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      let errorMessage = 'Authentication failed';
      
      switch (errorParam) {
        case 'configuration':
          errorMessage = 'Authentication service is not configured. Please contact support.';
          break;
        case 'auth_failed':
          errorMessage = messageParam ? decodeURIComponent(messageParam) : 'Authentication failed';
          break;
        case 'callback_error':
          errorMessage = 'There was an error processing your authentication. Please try again.';
          break;
        default:
          errorMessage = 'Authentication failed. Please try again.';
      }
      
      setError(errorMessage);
      
      // Clear error parameters from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setLoginType('google');

    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Google login error:', err);
      
      if (err.message.includes('not configured') || err.message.includes('not enabled')) {
        setError('Google authentication is not enabled. Please use wallet login instead.');
      } else {
        setError(`Google login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setLoginType(null);
    }
  };

  const handleWalletLogin = async (walletAddress: string, walletType: string) => {
    setLoading(true);
    setError(null);
    setLoginType('wallet');

    try {
      await signInWithWallet(walletAddress, walletType);
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Wallet login error:', err);
      setError(`Wallet connection failed: ${err.message}`);
    } finally {
      setLoading(false);
      setLoginType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <ConvocoreLogo className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Convocore
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your preferred way to sign in
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Login Options */}
        <div className="space-y-4">
          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-600 shadow-sm"
            variant="outline"
          >
            <div className="flex items-center justify-center gap-3">
              {loading && loginType === 'google' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
              ) : (
                <Chrome className="h-5 w-5 text-[#4285f4]" />
              )}
              <span className="font-medium">Continue with Google</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-zinc-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-5 w-5 text-purple-500" />
              <span className="font-medium text-gray-900 dark:text-white">Connect Wallet</span>
            </div>
                         <WalletConnector
               onWalletConnected={handleWalletLogin}
             />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              href="/auth/signup" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 