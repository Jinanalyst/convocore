import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ConvoAI",
    dailyLimit: "10 requests per day",
    features: [
      "Basic AI features",
      "Standard response time",
      "Basic chat interface",
      "Community support",
      "Usage analytics"
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false
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
      "TRON blockchain payments"
    ],
    buttonText: "Subscribe with USDT",
    buttonVariant: "default" as const,
    popular: true
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
    popular: false
  }
];

export function PricingSection() {
  return (
    <section className="py-20 bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan for your AI conversation needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-zinc-800 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular 
                  ? "border-gray-900 dark:border-gray-700 shadow-lg ring-2 ring-gray-900/20 dark:ring-gray-700/20" 
                  : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Daily Limit */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Daily Requests
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-300">
                    {plan.dailyLimit}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full py-3 font-medium transition-all duration-200 ${
                    plan.popular 
                      ? "bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white border-gray-900 dark:border-gray-800 hover:border-gray-800 dark:hover:border-gray-700" 
                      : "border-gray-900 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-900 dark:hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Notice */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            All plans include unlimited chat history and data export. No setup fees.
          </p>
        </div>
      </div>
    </section>
  );
} 