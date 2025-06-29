import { pricingPlans } from './pricing-data';
import { Button } from './button';
import { CheckCircle, Zap, Crown } from 'lucide-react';

export function MobilePricingSection() {
  // Only show Pro and Premium plans
  const filteredPlans = pricingPlans.filter(plan => plan.plan === 'pro' || plan.plan === 'premium');

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'premium':
        return <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            Most Popular
          </span>
        );
      case 'premium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
            Best Value
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="block md:hidden py-8 px-2">
      <div className="space-y-6">
        {filteredPlans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
          >
            {/* Plan Badge */}
            {getPlanBadge(plan.plan) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                {getPlanBadge(plan.plan)}
              </div>
            )}

            {/* Plan Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                plan.plan === 'pro' ? 'bg-blue-100 dark:bg-blue-900/20' :
                'bg-purple-100 dark:bg-purple-900/20'
              }`}>
                {getPlanIcon(plan.plan)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              className={`w-full h-12 text-lg font-semibold ${
                plan.plan === 'pro'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              }`}
              onClick={() => {
                window.location.href = '/auth/login';
              }}
            >
              {plan.buttonText}
            </Button>

            {/* Additional Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              One-time payment • No recurring fees • Instant access
            </p>
          </div>
        ))}
      </div>
    </section>
  );
} 