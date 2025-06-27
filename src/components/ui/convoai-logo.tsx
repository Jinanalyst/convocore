import * as React from "react";

export function ConvoAILogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ minWidth: 0 }}>
      {/* SVG Speech Bubble Logo */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 md:w-12 md:h-12"
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
      <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap select-none">
        ConvoAI
      </span>
    </div>
  );
} 