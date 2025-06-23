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

  const HexagonIcon = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <path d="M30 5 L50 15 L50 35 L30 45 L10 35 L10 15 Z" 
            fill="currentColor" 
            className="text-gray-900 dark:text-white" />
      
      {/* Inner C shape */}
      <path d="M25 15 Q20 10 20 20 Q20 30 25 25 L25 30 Q15 35 15 20 Q15 5 25 10 L25 15 Z" 
            fill="currentColor" 
            className="text-white dark:text-gray-900" />
      <path d="M35 15 Q40 10 40 20 Q40 30 35 25 L35 30 Q45 35 45 20 Q45 5 35 10 L35 15 Z" 
            fill="currentColor" 
            className="text-white dark:text-gray-900" />
    </svg>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <HexagonIcon className={`${sizeClasses[size]}`} />
        <div className="absolute inset-0 bg-gray-900 dark:bg-white rounded-lg opacity-5 blur-sm"></div>
      </div>
      {showText && (
        <span className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
          Convocore
        </span>
      )}
    </div>
  );
} 