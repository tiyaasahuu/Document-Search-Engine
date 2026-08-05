"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Search,
  Download,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onRotate: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  fileName?: string;
}

export function PDFToolbar({
  currentPage,
  totalPages,
  scale,
  rotation,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onRotate,
  isFullscreen,
  onToggleFullscreen,
  fileName = "Research_Paper_AI.pdf",
}: PDFToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      toast.info(`Searching for "${searchText.trim()}" across 24 pages...`);
    }
  };

  const handleDownload = () => {
    toast.success(`Downloading "${fileName}"...`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 h-14 px-4 bg-card/60 border-b border-border/60 backdrop-blur-xs select-none">
      {/* Left: Page Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Page</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handlePageInput}
            className="w-12 h-8 text-center text-xs px-1 font-bold bg-background border-border/80"
          />
          <span>of <strong className="text-foreground">{totalPages}</strong></span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Center: Search & Zoom & Rotate Controls */}
      <div className="flex items-center gap-1.5">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Input
              type="search"
              placeholder="Find in PDF..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 text-xs w-36 sm:w-48 pl-7 pr-2"
              autoFocus
            />
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </form>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Search Text in Document"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-xs font-bold text-foreground w-12 text-center">
          {Math.round(scale * 100)}%
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={onZoomIn}
          disabled={scale >= 2.5}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFitWidth}
          className="h-8 px-2.5 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground"
          title="Fit to Width"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Fit Width</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRotate}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={`Rotate Page (${rotation}°)`}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleFullscreen}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
