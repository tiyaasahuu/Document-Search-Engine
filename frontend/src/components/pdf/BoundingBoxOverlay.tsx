"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BoundingBoxOverlayProps {
  isVisible: boolean;
  pageNumber: number;
  pageWidth?: number;
  pageHeight?: number;
  bboxes?: number[][];
  highlightText?: string;
}

export function BoundingBoxOverlay({
  isVisible,
  pageNumber,
  pageWidth = 612,
  pageHeight = 792,
  bboxes,
  highlightText,
}: BoundingBoxOverlayProps) {
  if (!isVisible) return null;

  const validBboxes = bboxes && bboxes.length > 0 ? bboxes : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {validBboxes ? (
        validBboxes.map((box, idx) => {
          const [x0, y0, x1, y1] = box;
          const pw = pageWidth > 0 ? pageWidth : 612;
          const ph = pageHeight > 0 ? pageHeight : 792;

          const left = `${Math.max(0, Math.min(100, (x0 / pw) * 100))}%`;
          const top = `${Math.max(0, Math.min(100, (y0 / ph) * 100))}%`;
          const width = `${Math.max(1, Math.min(100, ((x1 - x0) / pw) * 100))}%`;
          const height = `${Math.max(1, Math.min(100, ((y1 - y0) / ph) * 100))}%`;

          return (
            <div
              key={`bbox-${idx}`}
              className="absolute rounded-md border-2 border-primary bg-primary/20 shadow-md backdrop-blur-[1px] transition-all animate-pulse"
              style={{ top, left, width, height }}
            >
              {idx === 0 && (
                <div className="absolute -top-7 left-0 z-30">
                  <Badge
                    variant="default"
                    className="gap-1 text-[10px] font-bold bg-primary text-primary-foreground shadow-xs py-0.5 px-2"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Page {pageNumber} Citation Highlight</span>
                  </Badge>
                </div>
              )}
            </div>
          );
        })
      ) : (
        /* Fallback highlight banner when bboxes list is empty */
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg p-3 rounded-xl border-2 border-primary bg-primary/10 shadow-lg backdrop-blur-xs transition-all z-20 animate-pulse text-center">
          <Badge variant="default" className="gap-1.5 text-[11px] font-bold bg-primary text-primary-foreground mx-auto mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Page {pageNumber} Target Citation</span>
          </Badge>
          {highlightText && (
            <p className="text-xs font-semibold text-foreground bg-background/95 p-2 rounded-lg border border-primary/30 text-left line-clamp-2 mt-1">
              &quot;{highlightText}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
