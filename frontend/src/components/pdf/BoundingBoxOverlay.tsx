"use client";

import React from "react";
import { Sparkles, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BoundingBoxOverlayProps {
  isVisible: boolean;
  pageNumber: number;
}

export function BoundingBoxOverlay({ isVisible, pageNumber }: BoundingBoxOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[88%] max-w-lg p-4 rounded-xl border-2 border-primary bg-primary/10 shadow-lg backdrop-blur-xs transition-all z-20 pointer-events-none animate-fade-in">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge
          variant="default"
          className="gap-1.5 text-[11px] font-bold bg-primary text-primary-foreground shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          <span>Page {pageNumber} Target Highlight</span>
        </Badge>
        <span className="text-[10px] font-mono text-primary font-bold">
          [x:120, y:280, w:480, h:95]
        </span>
      </div>

      <p className="text-xs font-semibold text-foreground bg-background/90 p-3 rounded-lg border border-primary/40 shadow-xs leading-relaxed">
        &quot;The proposed retrieval method improves answer accuracy by combining dense vector search with reranking.&quot;
      </p>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground font-medium border-t border-primary/20 pt-2">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <Layers className="h-3.5 w-3.5" />
          <span>Bounding Box Preview: This area will later receive coordinates from the backend and highlight the exact paragraph used by AI.</span>
        </span>
      </div>
    </div>
  );
}
