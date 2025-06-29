import { pricingPlans } from './pricing-data';
import { Button } from './button';

export function MobilePricingSection() {
  return (
    <section className="block md:hidden py-8 px-2">
      {pricingPlans.filter(plan => plan.plan === 'pro' || plan.plan === 'premium').map(plan => (
        <div key={plan.name} className="mb-6 rounded-2xl border bg-white p-4 shadow-lg">
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">{plan.price}</span>
            <span className="text-gray-500">{plan.period}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
          <ul className="mb-4">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-base mb-1">
                <span role="img" aria-label="check">✅</span> {f}
              </li>
            ))}
          </ul>
          <Button className="w-full h-12 text-lg">{plan.buttonText}</Button>
        </div>
      ))}
    </section>
  );
} 