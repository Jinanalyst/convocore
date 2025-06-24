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
    dailyLimit: "3 requests per day",
    features: [
      "Basic AI features",
      "Standard response time",
      "Basic chat interface",
      "Community support",
      "Usage analytics",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
    plan: undefined,
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
      "Multi-network USDT payments",
    ],
    buttonText: "Subscribe with USDT",
    buttonVariant: "default" as const,
    popular: true,
    plan: "pro" as const,
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
      "Smart contract automation",
    ],
    buttonText: "Subscribe with USDT",
    buttonVariant: "default" as const,
    popular: false,
    plan: "premium" as const,
  },
];

export function HomePricingSection() {
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium" | undefined>(undefined);

  const handlePlanSelect = (plan: "pro" | "premium" | undefined) => {
    if (plan) {
      // Redirect to dedicated payment page with plan pre-selected
      window.location.href = `/pricing?plan=${plan}`;
    } else {
      // Free plan: go straight to signup
      window.location.href = "/auth/signup";
    }
  };

  return (
    <>
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mt-4">
              Select the perfect plan for your AI conversation needs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border transition-all backdrop-blur-sm bg-white/70 dark:bg-zinc-800/60 p-8 hover:shadow-xl ${
                  plan.popular ? "border-black shadow-lg scale-105" : "border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black text-white px-4 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{plan.period}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.buttonVariant}
                  onClick={() => handlePlanSelect(plan.plan)}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BillingModal
        open={showBillingModal}
        onOpenChange={setShowBillingModal}
        selectedPlan={selectedPlan}
      />
    </>
  );
} 