"use client";

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

  const ModernIcon = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
        <linearGradient id="cGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#f8fafc"/>
        </linearGradient>
      </defs>
      
      {/* Outer circle with gradient */}
      <circle cx="40" cy="40" r="36" fill="url(#bgGradient)" stroke="none"/>
      
      {/* Modern geometric C */}
      <path d="M32 20 
               C45 20 55 30 55 40 
               C55 50 45 60 32 60
               L32 52
               C40 52 47 45 47 40
               C47 35 40 28 32 28
               L32 20 Z" 
            fill="url(#cGradient)" 
            stroke="none"/>
      
      {/* Inner accent dot */}
      <circle cx="52" cy="40" r="3" fill="url(#cGradient)" opacity="0.8"/>
    </svg>
  );

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <ModernIcon className={`${sizeClasses[size]} drop-shadow-sm`} />
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
          Convocore
        </span>
      )}
    </div>
  );
} 