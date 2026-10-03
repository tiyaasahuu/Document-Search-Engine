"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";
import { pdfjs, Document, Page } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFContainerProps {
  fileUrl?: string | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  showHighlight?: boolean;
  bboxes?: number[][];
  pageWidth?: number;
  pageHeight?: number;
  highlightText?: string;
  isMissing?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onDocumentLoadSuccess?: (pdf: { numPages: number }) => void;
}

export function PDFContainer({
  fileUrl,
  currentPage,
  totalPages,
  scale,
  rotation,
  showHighlight = true,
  bboxes,
  pageWidth,
  pageHeight,
  highlightText,
  isMissing = false,
  errorMessage,
  onRetry,
  onDocumentLoadSuccess,
}: PDFContainerProps) {
  const [renderError, setRenderError] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: pageWidth || 612,
    height: pageHeight || 792,
  });

  if (isMissing || errorMessage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-foreground">
            {errorMessage ? "Failed to Load Document" : "PDF Document Not Found"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {errorMessage || "The requested file could not be loaded or does not exist."}
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

  const effectivePageWidth = pageWidth || pageSize.width;
  const effectivePageHeight = pageHeight || pageSize.height;

  return (
    <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-muted/20 selection:bg-primary/20">
      <div
        className="relative transition-all duration-300 origin-top shadow-2xl rounded-xl overflow-hidden border border-border/80 bg-card flex flex-col items-center justify-center min-h-[850px] w-full max-w-[900px]"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {fileUrl ? (
          <div className="relative w-full flex flex-col items-center justify-center min-h-[850px]">
            {/* Bounding Box Highlight Overlay */}
            <BoundingBoxOverlay
              isVisible={showHighlight}
              pageNumber={currentPage}
              pageWidth={effectivePageWidth}
              pageHeight={effectivePageHeight}
              bboxes={bboxes}
              highlightText={highlightText}
            />

            {!renderError ? (
              <Document
                file={fileUrl}
                onLoadSuccess={(pdf) => onDocumentLoadSuccess?.(pdf)}
                onLoadError={(err) => {
                  console.warn("react-pdf render warning, falling back to embedded object:", err);
                  setRenderError(true);
                }}
                loading={
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-xs font-semibold text-muted-foreground">Rendering PDF Page...</p>
                  </div>
                }
                className="flex justify-center w-full"
              >
                <Page
                  pageNumber={currentPage}
                  rotate={rotation}
                  width={Math.min(800, window.innerWidth > 768 ? 780 : 360)}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onLoadSuccess={(page) => {
                    setPageSize({ width: page.width, height: page.height });
                  }}
                  className="shadow-md rounded-lg overflow-hidden border border-border/40"
                />
              </Document>
            ) : (
              /* Fallback embedded viewer if react-pdf canvas fails */
              <object
                data={`${fileUrl}#page=${currentPage}`}
                type="application/pdf"
                className="w-full flex-1 min-h-[850px] border-none rounded-xl"
              >
                <iframe
                  src={`${fileUrl}#page=${currentPage}`}
                  className="w-full flex-1 min-h-[850px] border-none rounded-xl"
                  title="PDF Document Viewer"
                />
              </object>
            )}
          </div>
        ) : (
          /* Demo Canvas Preview when no document_id parameter is passed */
          <div className="relative w-full p-8 sm:p-12 space-y-6 text-foreground font-serif leading-relaxed">
            <BoundingBoxOverlay
              isVisible={showHighlight}
              pageNumber={currentPage}
              pageWidth={612}
              pageHeight={792}
              bboxes={bboxes}
              highlightText={highlightText}
            />

            <div className="border-b border-border/60 pb-4 flex items-center justify-between text-xs font-sans text-muted-foreground">
              <span className="font-bold text-foreground">DOCUMENT RESEARCH INTELLIGENCE ENGINE</span>
              <span>SECTION {currentPage} • DEMO PREVIEW</span>
            </div>

            <div className="space-y-2 font-sans pt-2">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">
                Demo Page {currentPage} of {totalPages}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-sans tracking-tight text-foreground">
                Document Search Engine & RAG Research Suite
              </h2>
              <p className="text-xs text-muted-foreground font-sans">
                Select an uploaded document from the Search or Chat tab to view original PDF pages.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 font-sans space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary">
                  1. Document Navigation Guide
                </h4>
                <p className="text-xs text-muted-foreground">
                  Click on any RAG citation card in Chat or &quot;View in Document&quot; in Semantic Search to jump directly to target pages.
                </p>
              </div>

              <p>
                The document viewer renders original high-resolution PDFs directly from backend storage while enforcing access boundaries and path security.
              </p>

              <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-primary tracking-wider">
                  Page {currentPage} Citation Status
                </span>
                <p className="font-semibold text-foreground">
                  &quot;Pass document_id in URL query string to stream original PDF file.&quot;
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 flex items-center justify-between text-xs font-sans text-muted-foreground">
              <span>PDF Viewer Engine</span>
              <span>Page {currentPage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
