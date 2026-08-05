"use client";

import React, { useState } from "react";
import { BookOpen, FileText, ExternalLink, CheckCircle2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CitationItem {
  id: string;
  documentName: string;
  pageNumber: number;
  snippet: string;
  confidence: number;
}

interface CitationCardProps {
  citation: CitationItem;
  onViewPDF?: (citation: CitationItem) => void;
}

export function CitationCard({ citation, onViewPDF }: CitationCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-xs hover:border-primary/50 transition-all group">
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

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
          Page {citation.pageNumber}
        </span>
        <span>Paragraph Citation</span>
      </div>

      <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/40">
        &quot;{citation.snippet}&quot;
      </p>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewPDF?.(citation)}
        className="w-full h-7 text-xs gap-1.5 font-medium text-primary hover:bg-primary/10"
      >
        <span>View in PDF</span>
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function CitationPanel({ citations }: { citations: CitationItem[] }) {
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  const handleViewPDF = (citation: CitationItem) => {
    setSelectedCitation(citation);
    toast.info(`Opening PDF preview for Page ${citation.pageNumber}`);
  };

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
        {citations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground mx-auto" />
            <p>No citations generated for current query yet.</p>
          </div>
        ) : (
          citations.map((c) => (
            <CitationCard key={c.id} citation={c} onViewPDF={handleViewPDF} />
          ))
        )}
      </div>

      {/* Reserved Area for Future Bounding Box Highlight Preview */}
      <div className="pt-3 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            Bounding Box Preview
          </span>
          <span className="text-[10px] text-primary">OCR Active</span>
        </div>

        <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-center space-y-2">
          {selectedCitation ? (
            <div className="space-y-1 text-left text-xs">
              <span className="font-semibold text-foreground">Bounding Box Highlighted</span>
              <p className="text-[11px] text-muted-foreground">
                Page {selectedCitation.pageNumber} • [x:120, y:340, w:450, h:80]
              </p>
              <div className="h-16 rounded bg-primary/10 border border-primary/40 flex items-center justify-center text-[10px] text-primary font-mono">
                [OCR Box Highlight Active]
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a citation to load PDF bounding box highlighting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
