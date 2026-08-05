"use client";

import React, { useState, useEffect } from "react";
import { ViewerHeader } from "./ViewerHeader";
import { PDFToolbar } from "./PDFToolbar";
import { PDFContainer } from "./PDFContainer";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { CitationCard, PDFCitation } from "./CitationCard";
import { OutlinePanel } from "./OutlinePanel";
import { MetadataPanel } from "./MetadataPanel";
import { BottomActionBar } from "./BottomActionBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ListTree, Info, Layers } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";

const DUMMY_CITATIONS: PDFCitation[] = [
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
    confidence: 94,
    previewText: "Experimental benchmarks demonstrate an 18% gain in prediction precision on technical documents.",
  },
  {
    id: "cit-3",
    documentName: "Research_Paper_AI.pdf",
    pageNumber: 1,
    confidence: 99,
    previewText: "Hybrid Dense-Sparse Vector Retrieval & Reranking Architecture for Enterprise RAG Systems.",
  },
];

export function ViewerLayout() {
  const [currentPage, setCurrentPage] = useState<number>(12);
  const totalPages = 24;
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("citations");
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);

  // Simulate loading skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
  const handleFitWidth = () => setScale(1.0);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleToggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const handleGoToHighlight = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setMobilePanelOpen(false);
    toast.info(`Jumped to Page ${pageNumber} citation highlight`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <ViewerHeader
        documentName="Research_Paper_AI.pdf"
        lastModified="2 hours ago"
      />

      {/* Main 70/30 Split Workspace */}
      <div
        className={`flex flex-col lg:flex-row h-[calc(100vh-13rem)] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none border-none h-screen" : ""
        }`}
      >
        {/* LEFT COLUMN (70%): PDF Reader Toolbar & Canvas */}
        <div className="flex-1 lg:w-[70%] flex flex-col min-w-0 h-full border-b lg:border-b-0 lg:border-r border-border/60">
          {/* PDF Toolbar */}
          <PDFToolbar
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            rotation={rotation}
            onPageChange={handlePageChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitWidth={handleFitWidth}
            onRotate={handleRotate}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            fileName="Research_Paper_AI.pdf"
          />

          {/* PDF Viewer Canvas with Loading Skeleton */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center p-6 bg-muted/20">
              <LoadingSkeleton />
            </div>
          ) : (
            <PDFContainer
              currentPage={currentPage}
              totalPages={totalPages}
              scale={scale}
              rotation={rotation}
              showHighlight={true}
            />
          )}
        </div>

        {/* RIGHT COLUMN (30%): AI Workspace Panel with Tabs */}
        <div className="hidden lg:flex w-full lg:w-[30%] shrink-0 flex-col h-full bg-card/60">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            {/* Tabs Header Bar */}
            <div className="p-3 border-b border-border/60 bg-muted/30">
              <TabsList className="grid grid-cols-3 w-full h-9">
                <TabsTrigger value="citations" className="text-xs gap-1.5 font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Citations</span>
                </TabsTrigger>

                <TabsTrigger value="outline" className="text-xs gap-1.5 font-semibold">
                  <ListTree className="h-3.5 w-3.5" />
                  <span>Outline</span>
                </TabsTrigger>

                <TabsTrigger value="info" className="text-xs gap-1.5 font-semibold">
                  <Info className="h-3.5 w-3.5" />
                  <span>Doc Info</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: AI Citations */}
            <TabsContent value="citations" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <span className="text-xs font-bold text-foreground">Verified AI Citations</span>
                <Badge variant="secondary" className="text-[10px]">
                  {DUMMY_CITATIONS.length} Sources
                </Badge>
              </div>

              {DUMMY_CITATIONS.map((citation) => (
                <CitationCard
                  key={citation.id}
                  citation={citation}
                  onGoToHighlight={handleGoToHighlight}
                  isActive={currentPage === citation.pageNumber}
                />
              ))}

              <div className="pt-4 border-t border-border/60 space-y-2">
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Bounding Box Highlight Status</span>
                </div>
                <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-xs text-center space-y-1">
                  <p className="font-bold text-primary">Bounding Box Overlay Active</p>
                  <p className="text-[11px] text-muted-foreground">
                    Target paragraph highlighted on page {currentPage}.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Document Outline */}
            <TabsContent value="outline" className="flex-1 overflow-y-auto m-0">
              <OutlinePanel
                activePage={currentPage}
                onSelectSection={handleGoToHighlight}
              />
            </TabsContent>

            {/* Tab 3: Document Information */}
            <TabsContent value="info" className="flex-1 overflow-y-auto m-0">
              <MetadataPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile / Tablet Panel Sheet Drawer */}
        <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
          <SheetContent side="right" className="p-0 w-80 border-l border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="p-3 border-b border-border/60">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="citations" className="text-xs">Citations</TabsTrigger>
                  <TabsTrigger value="outline" className="text-xs">Outline</TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="citations" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
                {DUMMY_CITATIONS.map((c) => (
                  <CitationCard key={c.id} citation={c} onGoToHighlight={handleGoToHighlight} />
                ))}
              </TabsContent>
              <TabsContent value="outline" className="flex-1 overflow-y-auto m-0">
                <OutlinePanel activePage={currentPage} onSelectSection={handleGoToHighlight} />
              </TabsContent>
              <TabsContent value="info" className="flex-1 overflow-y-auto m-0">
                <MetadataPanel />
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar />
    </div>
  );
}
