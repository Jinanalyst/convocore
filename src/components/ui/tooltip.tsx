import React, { ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <span className="relative group inline-block">
      {children}
      <span className="pointer-events-none absolute left-1/2 z-50 top-full mt-2 w-max min-w-[80px] -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
        {content}
      </span>
    </span>
  );
}; 