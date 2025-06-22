export function ConvoAILogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <div className="w-12 h-12 bg-gray-900 dark:bg-gray-800 rounded-xl flex items-center justify-center relative overflow-hidden">
          {/* Chat bubble tail */}
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
          
          {/* Network/circuit pattern */}
          <div className="relative z-10">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-white"
            >
              {/* Central hub */}
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              
              {/* Connection nodes */}
              <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="18" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="16" r="1.5" fill="currentColor"/>
              <circle cx="18" cy="16" r="1.5" fill="currentColor"/>
              
              {/* Connection lines */}
              <line x1="12" y1="12" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="12" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="12" x2="6" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="12" x2="18" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Logo Text */}
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        ConvoAI
      </span>
    </div>
  );
} 