"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingSkeleton() {
  return (
    <div className="w-full max-w-[780px] h-[920px] p-8 sm:p-12 space-y-6 rounded-xl border border-border/80 bg-card shadow-2xl animate-pulse select-none">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* Title skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-3 w-32 bg-primary/20 rounded" />
        <div className="h-7 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted/60 rounded" />
      </div>

      {/* Section Skeleton Box */}
      <div className="p-6 rounded-xl border border-border/60 bg-muted/30 space-y-3">
        <div className="h-4 w-40 bg-primary/20 rounded" />
        <div className="h-3 w-full bg-muted/60 rounded" />
        <div className="h-3 w-5/6 bg-muted/60 rounded" />
      </div>

      {/* Text Lines Skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-3 w-full bg-muted/60 rounded" />
        <div className="h-3 w-full bg-muted/60 rounded" />
        <div className="h-3 w-4/5 bg-muted/60 rounded" />
        <div className="h-3 w-9/12 bg-muted/60 rounded" />
      </div>

      {/* Highlight Box Skeleton */}
      <div className="p-6 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
        <div className="h-3 w-36 bg-primary/30 rounded" />
        <div className="h-4 w-full bg-primary/20 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-12 flex items-center justify-between border-t border-border/60">
        <div className="h-3 w-36 bg-muted/60 rounded" />
        <div className="h-3 w-16 bg-muted/60 rounded" />
      </div>

      <div className="flex items-center justify-center gap-2 pt-4 text-xs font-semibold text-muted-foreground">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span>Rendering High-Resolution PDF Canvas...</span>
      </div>
    </div>
  );
}
