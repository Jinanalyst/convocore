import React from "react";
import { cn } from "@/lib/utils";

interface BackgroundPathsProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

// A simple reusable full-page animated background made of SVG paths.
// Accepts children and spans the full viewport. Works in both light / dark themes.
export const BackgroundPaths: React.FC<BackgroundPathsProps> = ({
  className,
  children,
  title,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900",
        className,
      )}
      {...props}
    >
      {/* Decorative animated SVG paths */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full animate-[gradientShift_30s_linear_infinite] opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        viewBox="0 0 800 800"
      >
        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {Array.from({ length: 20 }).map((_, i) => (
          <path
            key={i}
            d="M0 0L800 800"
            stroke="url(#grad)"
            strokeWidth="1"
            transform={`translate(${-400 + i * 40} 0)`}
          />
        ))}
      </svg>

      {/* Optional overlay title for demo purposes */}
      {title && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/10">
          {title}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export function DemoBackgroundPaths() {
  return <BackgroundPaths title="Background Paths" />;
} 