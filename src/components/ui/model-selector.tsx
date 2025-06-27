"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvailableModelsForTier } from "@/lib/ai-service";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  plan?: 'free' | 'pro' | 'premium';
}

export function ModelSelector({ selectedModel, onModelChange, plan = 'free' }: ModelSelectorProps) {
  const availableModels = getAvailableModelsForTier(plan);
  const currentModel = availableModels.find(model => model.id === selectedModel) || availableModels[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-2 text-left justify-start font-normal hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white dark:bg-black rounded-full"></div>
            </div>
            <span className="text-sm font-medium">{currentModel.name}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className="flex items-center gap-3 p-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white dark:bg-black rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.description}</div>
              </div>
            </div>
            {selectedModel === model.id && (
              <Check className="w-4 h-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 