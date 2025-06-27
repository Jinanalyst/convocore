"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if user is already connected via wallet
        const walletConnected = localStorage.getItem('wallet-connected');
        const walletPublicKey = localStorage.getItem('wallet-public-key');

        if (walletConnected && walletPublicKey) {
          // User is already authenticated via wallet
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          setTimeout(() => {
            router.push('/chat');
          }, 2000);
          return;
        }

        // Check for magic link parameters
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (token && email) {
          // Handle magic link authentication
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, email }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setStatus('success');
            setMessage('Email verification successful! Redirecting...');
            
            // Store session data
            localStorage.setItem('user-session', JSON.stringify(data.session));
            
            setTimeout(() => {
              router.push('/chat');
            }, 2000);
          } else {
            setStatus('error');
            setMessage(data.error || 'Authentication failed');
          }
        } else {
          // No authentication parameters found
          setStatus('error');
          setMessage('No authentication parameters found');
          
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Authentication Failed';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              {getIcon()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {getTitle()}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Loading...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Initializing authentication...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 