'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';

function VerifyPageContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setError('Invalid magic link. Missing token or email.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          
          // Set session cookies
          document.cookie = `session_token=${result.sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
          document.cookie = `user_email=${email}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `user_id=${result.userId}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `auth_method=magic_link; path=/; max-age=${60 * 60 * 24 * 7}`;

          // Redirect after a short delay
          setTimeout(() => {
            router.push(result.redirectTo || '/convocore');
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError('Network error. Please try again.');
      }
    };

    verifyMagicLink();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <ConvocoreLogo className="mx-auto h-12 w-auto" />
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Verifying your magic link...</h2>
            <p className="text-gray-400">Please wait while we sign you in.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-8 h-8 mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Successfully signed in!</h2>
            <p className="text-gray-400">Redirecting you to Convocore...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-8 h-8 mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
            <p className="text-red-400">{error}</p>
            <div className="pt-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
} 