"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingModal } from "@/components/modals/billing-modal";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ConvoAI",
    dailyLimit: "3 chats per day",
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
      "API access & keys",
      "Advanced AI models",
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

const supportedNetworks = [
  { name: "TRON", icon: "🔗", symbol: "TRX" },
  { name: "Ethereum", icon: "⟠", symbol: "ETH" },
  { name: "BNB Chain", icon: "🟡", symbol: "BNB" },
  { name: "Polygon", icon: "🟣", symbol: "MATIC" },
  { name: "Solana", icon: "🌅", symbol: "SOL", comingSoon: true }
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
                <span className="text-lg">💳</span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">PayPal</span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                or USDT on:
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

          {/* Payment Methods */}
          <div className="mt-12 sm:mt-16 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Secure Multi-Network Payments
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {supportedNetworks.map((network) => (
                <div
                  key={network.name}
                  className={`relative p-4 border rounded-lg transition-all hover:shadow-md ${
                    network.comingSoon 
                      ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' 
                      : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}
                >
                  {network.comingSoon && (
                    <div className="absolute -top-2 -right-2">
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Soon
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-2">{network.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {network.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {network.symbol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Users Info */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Google Users Welcome!
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                Already signed in with Google? Perfect! You can easily subscribe to any plan using PayPal or USDT payments. 
                Choose PayPal for traditional payment methods, or connect a crypto wallet for USDT payments. Your plan will be 
                linked to your Google account for seamless access across all devices.
              </p>
            </div>
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