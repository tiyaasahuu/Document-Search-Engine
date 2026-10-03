"use client";

import React, { useEffect, useState } from "react";
import { ListTree, ChevronRight, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { documentService } from "@/services/documentService";
import { OutlineItem } from "@/types";

interface OutlinePanelProps {
  documentId?: string | null;
  activePage: number;
  onSelectSection: (pageNumber: number) => void;
}

export function OutlinePanel({ documentId, activePage, onSelectSection }: OutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!documentId) {
      setOutline([]);
      return;
    }

    async function loadOutline() {
      setIsLoading(true);
      try {
        const items = await documentService.getDocumentOutline(documentId!);
        setOutline(items);
      } catch (err) {
        console.error("Failed to load document outline:", err);
        setOutline([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadOutline();
  }, [documentId]);

  return (
    <div className="space-y-4 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm tracking-tight text-foreground">
            Document Outline
          </h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {outline.length} {outline.length === 1 ? "Section" : "Sections"}
        </Badge>
      </div>

      {/* Sections List or Empty State */}
      {isLoading ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Loading outline...
        </div>
      ) : outline.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground space-y-2 rounded-xl border border-dashed border-border/60 bg-muted/20">
          <Bookmark className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">No Outline Bookmarks</p>
          <p className="text-[11px] text-muted-foreground">
            This PDF does not contain embedded table of contents bookmarks.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1">
          {outline.map((item, idx) => {
            const isActive = activePage === item.page_number;
            const indentClass = item.level > 1 ? `ml-${Math.min((item.level - 1) * 3, 6)}` : "";
            return (
              <button
                key={`outline-${idx}-${item.page_number}`}
                onClick={() => onSelectSection(item.page_number)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs font-medium border ${indentClass} ${
                  isActive
                    ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="truncate">{item.title}</span>
                </div>

                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={`text-[10px] py-0 px-1.5 h-4 font-bold shrink-0 ml-2 ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  Page {item.page_number}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
