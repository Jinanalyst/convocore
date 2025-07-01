export const pricingPlans = [
  {
    name: "Pro",
    price: "150 USDT",
    period: "one-time fee",
    description: "For developers and power users",
    dailyLimit: "Unlimited requests",
    features: [
      "Unlimited AI requests",
      "Fast response times",
      "Email support",
    ],
    buttonText: "Pay 150 USDT",
    buttonVariant: "default" as const,
    popular: true,
    plan: "pro" as const,
    convoEquivalent: "10,000 CONVOAI Token",
    discount: null, // Placeholder for discount logic
  },
  {
    name: "Premium",
    price: "200 USDT",
    period: "one-time fee",
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
    ],
    buttonText: "Pay 200 USDT",
    buttonVariant: "default" as const,
    popular: false,
    plan: "premium" as const,
    convoEquivalent: "100,000 CONVOAI Token",
    discount: null, // Placeholder for discount logic
  },
]; 