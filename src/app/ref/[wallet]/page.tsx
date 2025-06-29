import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralPage({ params }: { params: { wallet: string } }) {
  const router = useRouter();
  const { wallet } = params;

  useEffect(() => {
    if (wallet) {
      // Store referral in localStorage or cookie for attribution
      localStorage.setItem('convocore_ref', wallet);
      // TODO: Call backend API to log referral visit
      // await fetch('/api/referral/track', { method: 'POST', body: JSON.stringify({ wallet }) });
      // Redirect to home or signup after short delay
      setTimeout(() => {
        router.replace('/');
      }, 1200);
    }
  }, [wallet, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tracking your referral...</h2>
      <p className="text-gray-600 dark:text-gray-400">Redirecting you to ConvoCore...</p>
    </div>
  );
} 