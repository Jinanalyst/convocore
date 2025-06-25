"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: "horizontal" | "vertical";
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
  className?: string;
  resizeHandleClassName?: string;
  disabled?: boolean;
}

export function ResizablePanel({
  children,
  direction,
  initialSize = 320,
  minSize = 200,
  maxSize = 600,
  onResize,
  className,
  resizeHandleClassName,
  disabled = false,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startSizeRef = useRef(0);
  const startPositionRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsResizing(true);
    startSizeRef.current = size;
    startPositionRef.current = direction === "horizontal" ? e.clientX : e.clientY;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [size, direction, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const currentPosition = direction === "horizontal" ? e.clientX : e.clientY;
    const delta = currentPosition - startPositionRef.current;
    const newSize = Math.min(maxSize, Math.max(minSize, startSizeRef.current + delta));
    
    setSize(newSize);
    onResize?.(newSize);
  }, [isResizing, direction, minSize, maxSize, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Persist size to localStorage
  useEffect(() => {
    const key = `resizable-panel-${direction}`;
    localStorage.setItem(key, size.toString());
  }, [size, direction]);

  // Load size from localStorage on mount
  useEffect(() => {
    const key = `resizable-panel-${direction}`;
    const savedSize = localStorage.getItem(key);
    if (savedSize) {
      const parsedSize = parseInt(savedSize, 10);
      if (parsedSize >= minSize && parsedSize <= maxSize) {
        setSize(parsedSize);
      }
    }
  }, [direction, minSize, maxSize]);

  const panelStyle = direction === "horizontal"
    ? { width: size, minWidth: minSize, maxWidth: maxSize }
    : { height: size, minHeight: minSize, maxHeight: maxSize };

  const resizeHandleStyle = direction === "horizontal"
    ? "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:w-2 hover:bg-blue-500/20 transition-all group"
    : "absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:h-2 hover:bg-blue-500/20 transition-all group";

  return (
    <div
      ref={panelRef}
      className={cn("relative flex-shrink-0", className)}
      style={panelStyle}
    >
      {children}
      
      {!disabled && (
        <div
          className={cn(resizeHandleStyle, resizeHandleClassName)}
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500",
            direction === "horizontal" ? "w-0.5 h-full" : "h-0.5 w-full"
          )} />
        </div>
      )}
    </div>
  );
}
