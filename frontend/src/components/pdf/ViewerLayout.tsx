"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ViewerHeader } from "./ViewerHeader";
import { PDFToolbar } from "./PDFToolbar";
import { PDFContainer } from "./PDFContainer";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { OutlinePanel } from "./OutlinePanel";
import { MetadataPanel } from "./MetadataPanel";
import { BottomActionBar } from "./BottomActionBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ListTree, Info } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { documentService } from "@/services/documentService";
import { DocumentResponse } from "@/types";

export function ViewerLayout() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("document_id");
  const pageParam = searchParams.get("page");
  const highlightParam = searchParams.get("highlight");
  const bboxesParam = searchParams.get("bboxes");
  const pageWidthParam = searchParams.get("page_width");
  const pageHeightParam = searchParams.get("page_height");

  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);

  // Parse bounding boxes and dimensions if passed in searchParams
  let parsedBboxes: number[][] | undefined = undefined;
  if (bboxesParam) {
    try {
      parsedBboxes = JSON.parse(bboxesParam);
    } catch {
      // ignore JSON parse error if invalid format
    }
  }

  const pageWidth = pageWidthParam ? parseFloat(pageWidthParam) : undefined;
  const pageHeight = pageHeightParam ? parseFloat(pageHeightParam) : undefined;

  useEffect(() => {
    let activeBlobUrl: string | null = null;

    async function loadDocument() {
      if (!documentId) {
        setIsLoading(false);
        const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
        setCurrentPage(initialPage);
        setTotalPages(24);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const metadata = await documentService.getDocumentById(documentId);
        setDoc(metadata);

        // Fetch PDF via authenticated Authorization header as Blob and create Object URL
        activeBlobUrl = await documentService.getDocumentFileBlob(documentId);
        setFileUrl(activeBlobUrl);

        const maxPages = metadata.total_pages && metadata.total_pages > 0 ? metadata.total_pages : 1;
        setTotalPages(maxPages);

        let requestedPage = pageParam ? parseInt(pageParam, 10) : 1;
        if (isNaN(requestedPage) || requestedPage < 1) {
          requestedPage = 1;
        } else if (requestedPage > maxPages) {
          requestedPage = maxPages;
        }
        setCurrentPage(requestedPage);
      } catch (err: unknown) {
        console.error("Failed to load document metadata or PDF file:", err);
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Invalid or non-existent document ID.";
        setErrorMessage(detail);
        toast.error("Document Loading Error", { description: detail });
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [documentId, pageParam]);

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
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setMobilePanelOpen(false);
      toast.info(`Jumped to Page ${pageNumber}`);
    }
  };

  const docName = doc ? doc.original_filename : "Document Viewer";

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <ViewerHeader
        documentName={docName}
        lastModified={doc ? new Date(doc.upload_time).toLocaleDateString() : "Recently"}
        downloadUrl={fileUrl}
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
            fileName={docName}
          />

          {/* PDF Viewer Canvas with Loading Skeleton */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center p-6 bg-muted/20">
              <LoadingSkeleton />
            </div>
          ) : (
            <PDFContainer
              fileUrl={fileUrl}
              currentPage={currentPage}
              totalPages={totalPages}
              scale={scale}
              rotation={rotation}
              showHighlight={true}
              bboxes={parsedBboxes}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              highlightText={highlightParam || undefined}
              errorMessage={errorMessage}
              onDocumentLoadSuccess={(pdf) => setTotalPages(pdf.numPages)}
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
                <TabsTrigger value="info" className="text-xs gap-1.5 font-semibold">
                  <Info className="h-3.5 w-3.5" />
                  <span>Doc Info</span>
                </TabsTrigger>

                <TabsTrigger value="outline" className="text-xs gap-1.5 font-semibold">
                  <ListTree className="h-3.5 w-3.5" />
                  <span>Outline</span>
                </TabsTrigger>

                <TabsTrigger value="citations" className="text-xs gap-1.5 font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Overview</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Document Information */}
            <TabsContent value="info" className="flex-1 overflow-y-auto m-0">
              <MetadataPanel document={doc} />
            </TabsContent>

            {/* Tab 2: Document Outline */}
            <TabsContent value="outline" className="flex-1 overflow-y-auto m-0">
              <OutlinePanel
                documentId={documentId}
                activePage={currentPage}
                onSelectSection={handleGoToHighlight}
              />
            </TabsContent>

            {/* Tab 3: Overview & Citations */}
            <TabsContent value="citations" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <span className="text-xs font-bold text-foreground">Document Context</span>
                <Badge variant="secondary" className="text-[10px]">
                  {totalPages} Pages
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 text-xs space-y-2">
                <span className="font-bold text-foreground">Current Active Page</span>
                <p className="text-muted-foreground">
                  Page {currentPage} of {totalPages} selected. Use the toolbar or page controls to navigate through the document.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile / Tablet Panel Sheet Drawer */}
        <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
          <SheetContent side="right" className="p-0 w-80 border-l border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="p-3 border-b border-border/60">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                  <TabsTrigger value="outline" className="text-xs">Outline</TabsTrigger>
                  <TabsTrigger value="citations" className="text-xs">Context</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="info" className="flex-1 overflow-y-auto m-0">
                <MetadataPanel document={doc} />
              </TabsContent>
              <TabsContent value="outline" className="flex-1 overflow-y-auto m-0">
                <OutlinePanel activePage={currentPage} onSelectSection={handleGoToHighlight} />
              </TabsContent>
              <TabsContent value="citations" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
                <div className="p-3 rounded-xl bg-muted/30 text-xs">
                  Page {currentPage} selected.
                </div>
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
