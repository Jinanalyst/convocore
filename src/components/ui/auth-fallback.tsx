"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Chrome, Wallet, ArrowRight } from 'lucide-react';

interface AuthFallbackProps {
  error: string;
  onGoogleLogin: () => void;
  onWalletLogin: () => void;
  onDismiss: () => void;
}

export const AuthFallback: React.FC<AuthFallbackProps> = ({
  error,
  onGoogleLogin,
  onWalletLogin,
  onDismiss
}) => {
  const isKakaoError = error.toLowerCase().includes('kakao') || error.includes('KOE205');

  if (!isKakaoError) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kakao Login Issue
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              카카오 로그인에 문제가 있습니다
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>

        {/* Alternative Options */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            다른 방법으로 로그인하세요:
          </p>
          
          {/* Google Login */}
          <Button
            onClick={onGoogleLogin}
            className="w-full h-12 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-600"
            variant="outline"
          >
            <div className="flex items-center justify-center gap-3">
              <Chrome className="h-5 w-5 text-[#4285f4]" />
              <span>Google로 계속하기</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
          </Button>

          {/* Wallet Login */}
          <Button
            onClick={onWalletLogin}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <div className="flex items-center justify-center gap-3">
              <Wallet className="h-5 w-5" />
              <span>지갑으로 연결하기</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
          >
            닫기
          </Button>
          <Button
            onClick={() => window.open('https://developers.kakao.com', '_blank')}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700"
          >
            카카오 문제 신고
          </Button>
        </div>

        {/* Technical Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Technical Info:</strong> This appears to be a configuration issue with Kakao OAuth in Supabase. 
            The service administrator needs to enable Kakao authentication in the Supabase dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}; 