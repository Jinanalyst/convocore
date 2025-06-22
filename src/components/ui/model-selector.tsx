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

const models = [
  {
    id: "gpt-4o",
    name: "Convocore Omni",
    description: "플래그십 모델, 멀티모달, 고성능, 빠름",
    provider: "Convocore",
  },
  {
    id: "gpt-4-turbo",
    name: "Convocore Turbo",
    description: "고속 응답 + 고품질 균형, 코드/텍스트 최적화",
    provider: "Convocore",
  },
  {
    id: "claude-3-opus-20240229",
    name: "Convocore Alpha",
    description: "가장 정밀한 추론 능력, 장문 작문, 고급 분석",
    provider: "Convocore",
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Convocore Nova",
    description: "균형 잡힌 성능, 빠른 응답, 실용적인 일상 업무에 적합",
    provider: "Convocore",
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const currentModel = models.find(model => model.id === selectedModel) || models[0];

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
        {models.map((model) => (
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