"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingModal } from "@/components/modals/billing-modal";
import { ConvoAILogo } from "@/components/ui/convoai-logo";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ConvoAI",
    dailyLimit: "3 requests per day",
    features: [
      "Basic AI features",
      "Standard response time",
      "Basic chat interface",
      "Community support",
      "Usage analytics"
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
    plan: undefined
  },
  {
    name: "Pro",
    price: "20 USDT",
    period: "per month",
    description: "For developers and power users",
    dailyLimit: "Unlimited requests",
    features: [
      "Unlimited AI requests",
      "Fast response times",
      "Email support",
      "Usage statistics",
      "Multi-network USDT payments"
    ],
    buttonText: "Subscribe with USDT",
    buttonVariant: "default" as const,
    popular: true,
    plan: "pro" as const
  },
  {
    name: "Premium",
    price: "40 USDT",
    period: "per month",
    description: "For businesses and advanced users",
    dailyLimit: "Unlimited requests",
    features: [
      "Everything in Pro",
      "Advanced AI capabilities",
      "Priority support",
      "Custom AI agent creation",
      "Advanced analytics",
      "Team collaboration",
      "Priority processing",
      "Smart contract automation"
    ],
    buttonText: "Subscribe with USDT",
    buttonVariant: "default" as const,
    popular: false,
    plan: "premium" as const
  }
];

interface NetworkInfo {
  name: string;
  icon: string;
  symbol: string;
  comingSoon?: boolean;
}

const supportedNetworks: NetworkInfo[] = [
  { name: "Solana", icon: "🌅", symbol: "SOL" }
];

export function PricingSection() {
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | undefined>(undefined);

  const handlePlanSelect = (plan: 'pro' | 'premium' | undefined) => {
    if (plan) {
      setSelectedPlan(plan);
      setShowBillingModal(true);
    } else {
      // Handle free plan - redirect to signup
      window.location.href = '/auth/signup';
    }
  };

  return (
    <>
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Select the perfect plan for your AI conversation needs
            </p>
            
            {/* Supported Networks */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Payment options:
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">ConvoAI Token</span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                or Solana on:
              </span>
              {supportedNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full"
                >
                  <span className="text-lg">{network.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {network.name}
                  </span>
                  {network.comingSoon && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-center px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px]">
                {/* Only the chat bubble SVG icon from ConvoAILogo */}
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 md:w-10 md:h-10"
                >
                  <rect x="2" y="2" width="40" height="32" rx="8" fill="url(#bubbleGradient)" />
                  <rect x="2" y="2" width="40" height="32" rx="8" stroke="#E5E7EB" strokeWidth="2" />
                  <rect x="10" y="12" width="24" height="3" rx="1.5" fill="#fff" />
                  <rect x="10" y="19" width="16" height="3" rx="1.5" fill="#fff" />
                  <path d="M18 34C18 36.2091 19.7909 38 22 38C24.2091 38 26 36.2091 26 34H18Z" fill="url(#bubbleGradient)" />
                  <defs>
                    <linearGradient id="bubbleGradient" x1="2" y1="2" x2="42" y2="34" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8B5CF6" />
                      <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-zinc-800 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular 
                    ? "border-black shadow-lg scale-105 lg:scale-110" 
                    : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-black text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Plan Header */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2 text-base sm:text-lg">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Daily Limit */}
                  <div className="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Daily Requests
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-black dark:text-white">
                      {plan.dailyLimit}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6 sm:mb-8">
                    <ul className="space-y-2 sm:space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelect(plan.plan)}
                    className={`w-full py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-200 ${
                      plan.buttonVariant === 'outline'
                        ? 'border-2 border-gray-300 dark:border-zinc-600 hover:border-black dark:hover:border-white'
                        : plan.popular
                        ? 'bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-black text-white'
                    }`}
                    variant={plan.buttonVariant}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Notice */}
          <div className="text-center mt-12 sm:mt-16">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              All plans include secure USDT payments across multiple blockchain networks. 
              No setup fees, cancel anytime. Your payments are processed instantly and securely.
              <br className="hidden sm:block" />
              <span className="block sm:inline mt-2 sm:mt-0 sm:ml-1">
                Need help choosing? <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact our team</a>
              </span>
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Instant payments
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Secure blockchain
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No hidden fees
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Modal */}
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal}
        selectedPlan={selectedPlan}
      />
    </>
  );
} 