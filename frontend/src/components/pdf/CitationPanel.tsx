"use client";

import React from "react";
import { BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CitationCard, PDFCitation } from "./CitationCard";

interface CitationPanelProps {
  citations: PDFCitation[];
  activePage: number;
  onGoToHighlight: (pageNumber: number) => void;
}

export function CitationPanel({
  citations,
  activePage,
  onGoToHighlight,
}: CitationPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card/60 border-l border-border/60 p-4 space-y-4 select-none">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm tracking-tight text-foreground">
          Verified Citations
        </h3>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {citations.length} Sources
        </Badge>
      </div>

      {/* Citation Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {citations.map((c) => (
          <CitationCard
            key={c.id}
            citation={c}
            onGoToHighlight={onGoToHighlight}
            isActive={activePage === c.pageNumber}
          />
        ))}
      </div>

      {/* Bounding Box Highlight Note Area */}
      <div className="pt-3 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            Bounding Box Status
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold">Active Overlay</span>
        </div>

        <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3.5 text-center space-y-1.5">
          <p className="text-xs font-bold text-primary">
            Bounding Box Highlight (Backend Integration Pending)
          </p>
          <p className="text-[11px] text-muted-foreground">
            Click &quot;Go to Highlight&quot; to inspect target bounding boxes on page {activePage}.
          </p>
        </div>
      </div>
    </div>
  );
}
