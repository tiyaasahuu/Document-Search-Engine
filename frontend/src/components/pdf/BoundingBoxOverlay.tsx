"use client";

import React from "react";
import { Sparkles, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BoundingBoxOverlayProps {
  isVisible: boolean;
  pageNumber: number;
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
}

export function BoundingBoxOverlay({
  isVisible,
  pageNumber,
  x = "50%",
  y = "112px",
  width = "88%",
  height = "auto",
}: BoundingBoxOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute p-4 rounded-xl border-2 border-primary bg-primary/10 shadow-lg backdrop-blur-xs transition-all z-20 pointer-events-none animate-pulse -translate-x-1/2 left-1/2"
      style={{
        top: typeof y === "number" ? `${y}px` : y,
        left: typeof x === "number" ? `${x}px` : x,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        maxWidth: "520px",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge
          variant="default"
          className="gap-1.5 text-[11px] font-bold bg-primary text-primary-foreground shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          <span>Page {pageNumber} Target Highlight</span>
        </Badge>
        <span className="text-[10px] font-mono text-primary font-bold">
          Bounding Box Preview
        </span>
      </div>

      <p className="text-xs font-semibold text-foreground bg-background/90 p-3 rounded-lg border border-primary/40 shadow-xs leading-relaxed">
        &quot;The proposed retrieval method improves answer accuracy by combining dense vector search with reranking.&quot;
      </p>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground font-medium border-t border-primary/20 pt-2">
        <span className="flex items-center gap-1.5 text-primary font-medium leading-normal">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>This highlighted region represents the paragraph used by the AI response. Backend-generated coordinates will replace these dummy values.</span>
        </span>
      </div>
    </div>
  );
}
