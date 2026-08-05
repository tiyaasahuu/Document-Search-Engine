"use client";

import React from "react";
import { BookOpen, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CitationCard, PDFCitation } from "./CitationCard";

const DUMMY_FULL_CITATIONS: PDFCitation[] = [
  {
    id: "cit-1",
    documentName: "Research_Paper_AI.pdf",
    pageNumber: 12,
    confidence: 98,
    previewText: "The proposed retrieval method improves answer accuracy by combining dense vector search with reranking.",
  },
  {
    id: "cit-2",
    documentName: "Research_Paper_AI.pdf",
    pageNumber: 14,
    confidence: 96,
    previewText: "Experimental benchmarks demonstrate an 18% gain in prediction precision on technical documents.",
  },
  {
    id: "cit-3",
    documentName: "Research_Paper_AI.pdf",
    pageNumber: 1,
    confidence: 99,
    previewText: "Hybrid Dense-Sparse Vector Retrieval & Reranking Architecture for Enterprise RAG Systems.",
  },
  {
    id: "cit-4",
    documentName: "Research_Paper_AI.pdf",
    pageNumber: 18,
    confidence: 95,
    previewText: "Latency metrics indicate single-digit millisecond query processing across multi-gigabyte corpus indexes.",
  },
];

interface CitationPanelProps {
  citations?: PDFCitation[];
  activePage: number;
  onGoToHighlight: (pageNumber: number) => void;
}

export function CitationPanel({
  citations = DUMMY_FULL_CITATIONS,
  activePage,
  onGoToHighlight,
}: CitationPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card/60 p-4 space-y-4 select-none">
      {/* Top Stats Header */}
      <div className="space-y-2 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm tracking-tight text-foreground">
              AI Citations
            </h3>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-1 font-bold">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>4 Verified Sources</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40">
          <span>Average Confidence:</span>
          <span className="font-extrabold text-emerald-500">97%</span>
        </div>
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

        <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-center space-y-1">
          <p className="text-xs font-bold text-primary">
            Bounding Box Ready
          </p>
          <p className="text-[11px] text-muted-foreground">
            Target paragraph highlighted on page {activePage}.
          </p>
        </div>
      </div>
    </div>
  );
}
