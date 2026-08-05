"use client";

import React from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SUGGESTED_PROMPTS = [
  "Summarize this document",
  "What are the key findings?",
  "Explain methodology",
  "List important definitions",
];

interface SuggestedQuestionsProps {
  onSelectPrompt: (promptText: string) => void;
}

export function SuggestedQuestions({ onSelectPrompt }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>Suggested Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs h-8 rounded-full border-border/80 bg-card/80 hover:border-primary/50 hover:bg-primary/5 transition-all gap-1.5 shadow-xs font-normal"
          >
            <span>{prompt}</span>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
          </Button>
        ))}
      </div>
    </div>
  );
}
