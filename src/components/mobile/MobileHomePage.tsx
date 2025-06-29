import { HomeFeaturesSection } from '@/components/ui/home-features-section';
import { MobilePricingSection } from '@/components/ui/MobilePricingSection';
import { ConvoAILogo } from '@/components/ui/convoai-logo';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MobileHomePage() {
  const router = useRouter();

  return (
    <div className="block md:hidden w-full min-h-screen bg-white dark:bg-black">
      <header className="flex flex-col items-center py-8">
        <ConvoAILogo className="w-16 h-16 mb-2" />
        <h1 className="text-3xl font-bold text-center mb-2">ConvoAI</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center px-4 mb-6">Your AI chat companion, now mobile-friendly!</p>
        <Button 
          onClick={() => router.push('/pricing')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          View Pricing
        </Button>
      </header>
      <main className="flex flex-col gap-8 px-2 pb-8">
        <HomeFeaturesSection />
        <MobilePricingSection />
      </main>
    </div>
  );
} 