import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

interface PDFContainerProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  showHighlight?: boolean;
  isMissing?: boolean;
  onRetry?: () => void;
}

export function PDFContainer({
  currentPage,
  totalPages,
  scale,
  rotation,
  showHighlight = true,
  isMissing = false,
  onRetry,
}: PDFContainerProps) {
  if (isMissing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-foreground">PDF Document Not Found</h3>
          <p className="text-xs text-muted-foreground">
            The requested file could not be loaded from the public directory.
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2 font-semibold text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Loading</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-muted/20 selection:bg-primary/20">
      <div
        className="relative transition-all duration-300 origin-top shadow-2xl rounded-xl overflow-hidden border border-border/80 bg-card"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          width: "100%",
          maxWidth: "780px",
          minHeight: "920px",
        }}
      >
        {/* Bounding Box Highlight Overlay */}
        <BoundingBoxOverlay isVisible={showHighlight} pageNumber={currentPage} />

        {/* PDF Page Rendering Canvas */}
        <div className="p-8 sm:p-12 space-y-6 text-foreground font-serif leading-relaxed">
          {/* Header Mock */}
          <div className="border-b border-border/60 pb-4 flex items-center justify-between text-xs font-sans text-muted-foreground">
            <span className="font-bold text-foreground">DOCUMENT RESEARCH INTELLIGENCE ENGINE</span>
            <span>SECTION {currentPage} • RESEARCH PAPER</span>
          </div>

          {/* Page Title */}
          <div className="space-y-2 font-sans pt-2">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Paper Page {currentPage} of {totalPages}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-sans tracking-tight text-foreground">
              Hybrid Dense-Sparse Vector Retrieval & Reranking Architecture
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              Authors: Dr. Aris Thorne, Elena Rostova, Marcus Vance • IEEE Research 2026
            </p>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 font-sans space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-primary">
                1. Executive Summary & Methodology
              </h4>
              <p className="text-xs text-muted-foreground">
                In this paper, we present a high-throughput RAG pipeline combining dense vector embeddings with sparse BM25 indexing. Our experimental evaluation confirms an 18% improvement in accuracy for complex research queries.
              </p>
            </div>

            <p>
              Traditional vector search mechanisms often struggle with domain-specific terminology, specialized code symbols, and numeric parameters. By enforcing a dual-stage retrieval model, our engine indexes content across high-dimensional embedding spaces while simultaneously preserving exact lexical keyword matrices.
            </p>

            <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-primary tracking-wider">
                Key Contribution [Page {currentPage}]
              </span>
              <p className="font-semibold text-foreground">
                &quot;The proposed retrieval method improves answer accuracy by combining dense vector search with reranking.&quot;
              </p>
            </div>

            <p>
              Experimental results across 50 benchmark datasets demonstrate that our hybrid pipeline resolves query ambiguities in under 1.2 seconds while guaranteeing 99.8% citation accuracy.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4 font-sans text-xs">
              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Dense Embedding Model</span>
                <p className="font-bold text-foreground">OpenAI text-embedding-3-large</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground">Sparse BM25 Reranker</span>
                <p className="font-bold text-foreground">Cohere Rerank v3</p>
              </div>
            </div>
          </div>

          {/* Page Footer */}
          <div className="border-t border-border/60 pt-4 flex items-center justify-between text-xs font-sans text-muted-foreground">
            <span>Confidential Research Material</span>
            <span>Page {currentPage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
