"use client";

import React from "react";
import { FileText, ArrowRight, Bookmark, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PDFCitation {
  id: string;
  documentName: string;
  pageNumber: number;
  confidence: number;
  previewText: string;
}

interface CitationCardProps {
  citation: PDFCitation;
  onGoToHighlight: (pageNumber: number) => void;
  isActive?: boolean;
}

export function CitationCard({
  citation,
  onGoToHighlight,
  isActive,
}: CitationCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs ${
        isActive
          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/40"
          : "border-border/80 bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold truncate text-foreground">
            {citation.documentName}
          </span>
        </div>

        <Badge
          variant="outline"
          className="text-[10px] py-0.2 px-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold"
        >
          {citation.confidence}% Match
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-foreground">
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          <span>Page {citation.pageNumber}</span>
        </div>

        <Badge
          variant="secondary"
          className="gap-1 text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20 font-bold"
        >
          <Layers className="h-2.5 w-2.5" />
          <span>Bounding Box Ready</span>
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/40">
        &quot;{citation.previewText}&quot;
      </p>

      <Button
        size="sm"
        onClick={() => onGoToHighlight(citation.pageNumber)}
        className="w-full h-8 text-xs gap-1.5 font-semibold shadow-xs"
      >
        <span>Jump To Citation</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
