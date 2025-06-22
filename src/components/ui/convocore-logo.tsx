"use client";

import { MessageCircle } from "lucide-react";

interface ConvocoreLogo {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConvocoreLogo({ 
  className = "", 
  showText = true, 
  size = "md" 
}: ConvocoreLogo) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <MessageCircle className={`${sizeClasses[size]} text-gray-900 dark:text-white`} />
        <div className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full opacity-10 blur-sm"></div>
      </div>
      {showText && (
        <span className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
          Convocore
        </span>
      )}
    </div>
  );
} 