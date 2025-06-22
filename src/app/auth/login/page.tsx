'use client';

import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';
import { WalletConnector } from '@/components/ui/wallet-connector';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/convocore';
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (loginMode === 'magic') {
      // Handle magic link
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        setMagicLinkSent(true);
      } catch {
        setError('Failed to send magic link');
      } finally {
        setLoading(false);
      }
    } else {
      // Handle password login
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          router.push(redirectTo);
          router.refresh();
        }
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async (walletAddress: string, walletType: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting wallet authentication...', { walletAddress, walletType });
      
      // For wallet authentication, we'll create a temporary session
      // and store user data directly without using Supabase auth
      
      // Generate a temporary user ID based on wallet address
      const tempUserId = `wallet_${walletAddress.toLowerCase()}`;

      // Store wallet connection in localStorage and cookies
      try {
        // Store wallet info in localStorage
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', walletAddress);
        localStorage.setItem('wallet_type', walletType);
        localStorage.setItem('user_id', tempUserId);
        
        // Also set cookies for middleware
        document.cookie = `wallet_connected=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
        document.cookie = `wallet_address=${walletAddress}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `wallet_type=${walletType}; path=/; max-age=${60 * 60 * 24 * 7}`;
        
        console.log('Wallet info stored in localStorage and cookies');
        console.log('Redirecting to:', redirectTo);
        
        // Use window.location for more reliable redirect
        window.location.href = redirectTo;
      } catch (storageError) {
        console.error('Failed to store wallet info:', storageError);
        setError('Failed to store wallet connection');
      }
    } catch (err) {
      console.error('Wallet authentication error:', err);
      setError('Wallet authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <ConvocoreLogo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Welcome back to Convocore
          </p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex bg-gray-900 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginMode('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'password'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('magic')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'magic'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Success Message for Magic Link */}
        {magicLinkSent && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-400">Magic link sent!</h3>
                <p className="mt-1 text-sm text-green-300">
                  Check your email for a secure login link. Click the link to sign in instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {loginMode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            )}
          </div>

          {loginMode === 'password' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-gray-900 border-gray-700 rounded focus:ring-gray-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          {loginMode === 'magic' && (
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Enter your email address and we'll send you a secure login link
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading || magicLinkSent}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
            >
              {loading 
                ? 'Processing...' 
                : magicLinkSent 
                ? 'Magic Link Sent' 
                : loginMode === 'magic' 
                ? 'Send Magic Link' 
                : 'Sign In'
              }
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              variant="outline"
              className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-900"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Wallet Login Section */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Or connect your wallet</span>
              </div>
            </div>

            <WalletConnector 
              onWalletConnected={handleWalletLogin}
            />
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 