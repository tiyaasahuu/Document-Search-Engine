"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-md my-3 mr-auto items-center animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
        <Sparkles className="h-4 w-4 animate-pulse" />
      </div>

      <div className="rounded-2xl bg-card border border-border/80 p-3.5 flex items-center gap-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Gemini 2.5 Flash is reasoning...
        </span>
      </div>
    </div>
  );
}
