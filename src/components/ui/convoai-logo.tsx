import * as React from "react";

interface ConvoAILogoProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ConvoAILogo({ className = "", orientation = 'horizontal' }: ConvoAILogoProps) {
  const isVertical = orientation === 'vertical';
  return (
    <div
      className={
        isVertical
          ? `flex flex-col items-center justify-center ${className}`
          : `flex items-center justify-center gap-2 sm:gap-3 ${className}`
      }
      style={{ minWidth: 0 }}
    >
      {/* SVG Speech Bubble Logo */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isVertical ? "w-8 h-8 md:w-10 md:h-10 mb-2" : "w-8 h-8 md:w-10 md:h-10"}
      >
        <rect x="2" y="2" width="40" height="32" rx="8" fill="url(#bubbleGradient)" />
        <rect x="2" y="2" width="40" height="32" rx="8" stroke="#E5E7EB" strokeWidth="2" />
        <rect x="10" y="12" width="24" height="3" rx="1.5" fill="#fff" />
        <rect x="10" y="19" width="16" height="3" rx="1.5" fill="#fff" />
        {/* Tail */}
        <path d="M18 34C18 36.2091 19.7909 38 22 38C24.2091 38 26 36.2091 26 34H18Z" fill="url(#bubbleGradient)" />
        <defs>
          <linearGradient id="bubbleGradient" x1="2" y1="2" x2="42" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Logo Text */}
      <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap select-none flex items-center" style={{lineHeight: 1}}>
        ConvoAI
      </span>
    </div>
  );
} 