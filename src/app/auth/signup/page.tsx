'use client';

import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';

function SignupPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/convocore';
  const supabase = createClientComponentClient();

  // KakaoTalk icon component
  const KakaoIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C7.03 3 3 6.58 3 11C3 13.83 4.83 16.31 7.59 17.62L6.67 20.84C6.58 21.13 6.89 21.36 7.15 21.21L11.12 18.95C11.41 18.98 11.7 19 12 19C16.97 19 21 15.42 21 11C21 6.58 16.97 3 12 3Z" fill="#FFE500"/>
      <path d="M12 3C7.03 3 3 6.58 3 11C3 13.83 4.83 16.31 7.59 17.62L6.67 20.84C6.58 21.13 6.89 21.36 7.15 21.21L11.12 18.95C11.41 18.98 11.7 19 12 19C16.97 19 21 15.42 21 11C21 6.58 16.97 3 12 3Z" fill="#3C1E1E"/>
    </svg>
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (dev mode)
          router.push(redirectTo);
          router.refresh();
        } else {
          // Email confirmation required
          setSuccess(true);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Authentication service is not configured. Please contact support.');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google signup error:', error);
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          setError('Google authentication failed. Please try again or use a different account.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else if (error.message.includes('configuration')) {
          setError('Google authentication is not properly configured. Please contact support.');
        } else {
          setError(`Google signup failed: ${error.message}`);
        }
      }
    } catch (err) {
      console.error('Google signup exception:', err);
      setError('An unexpected error occurred with Google signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setError('Authentication service is not configured. Please contact support.');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        console.error('Kakao signup error:', error);
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          setError('Kakao authentication failed. Please try again or use a different account.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else if (error.message.includes('configuration')) {
          setError('Kakao authentication is not properly configured. Please contact support.');
        } else {
          setError(`Kakao signup failed: ${error.message}`);
        }
      }
    } catch (err) {
      console.error('Kakao signup exception:', err);
      setError('An unexpected error occurred with Kakao signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <ConvocoreLogo className="mx-auto h-12 w-auto" />
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="text-gray-400">
              We've sent a confirmation link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to complete your account setup.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <ConvocoreLogo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join Convocore and start chatting with AI
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Create a password"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 bg-gray-900 border-gray-700 rounded focus:ring-gray-500"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
              I agree to the{' '}
              <Link href="/terms" className="text-white hover:text-gray-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-white hover:text-gray-300">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
            >
              {loading ? 'Creating account...' : 'Create account'}
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
              onClick={handleGoogleSignup}
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

            {/* Kakao Signup - Coming Soon */}
            <Button
              type="button"
              disabled={true}
              variant="outline"
              className="w-full bg-gray-200 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3 w-full">
                <KakaoIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span>Continue with Kakao</span>
                <span className="ml-auto text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full font-semibold">
                  Coming Soon
                </span>
              </div>
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
} 