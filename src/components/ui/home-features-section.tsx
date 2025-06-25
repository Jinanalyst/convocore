"use client";
import { MonitorSmartphone, Sparkles, Settings2 } from "lucide-react";

const features = [
  {
    icon: MonitorSmartphone,
    title: "Unified AI Collaboration Platform",
    description:
      "Convocore provides an integrated environment where users can collaborate seamlessly with AI-powered agents, enabling efficient task automation and teamwork.",
  },
  {
    icon: Sparkles,
    title: "Multi-Modal AI Support",
    description:
      "Access chat, code generation, and image creation through a single interface—boosting productivity with versatile AI capabilities.",
  },
  {
    icon: Settings2,
    title: "Customizable AI Models & Workflows",
    description:
      "Create and manage your own AI models and workflows, tailoring the system to automate complex processes for any project.",
  },
];

export function HomeFeaturesSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3 border-y border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-4 py-10 md:py-12 px-4 text-center md:text-left">
              <Icon className="h-8 w-8 mx-auto md:mx-0 text-blue-400" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto md:mx-0">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 