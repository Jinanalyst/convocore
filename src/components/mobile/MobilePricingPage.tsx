import { MobilePricingSection } from '@/components/ui/MobilePricingSection';

export default function MobilePricingPage() {
  return (
    <div className="block md:hidden w-full min-h-screen bg-white dark:bg-black">
      <header className="flex flex-col items-center py-8">
        <h1 className="text-3xl font-bold text-center mb-2">Pricing</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center px-4">Choose the perfect plan for your AI conversation needs</p>
      </header>
      <main className="flex flex-col gap-8 px-2 pb-8">
        <MobilePricingSection />
      </main>
    </div>
  );
} 