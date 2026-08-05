"use client";

import React from "react";
import { ListTree, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface OutlineItem {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
}

export const DOCUMENT_OUTLINE: OutlineItem[] = [
  { id: "sec-1", title: "1. Introduction", pageNumber: 1, level: 1 },
  { id: "sec-2", title: "2. Literature Review", pageNumber: 4, level: 1 },
  { id: "sec-3", title: "3. Methodology & Architecture", pageNumber: 12, level: 1 },
  { id: "sec-3-1", title: "3.1 Hybrid Vector Search", pageNumber: 14, level: 2 },
  { id: "sec-4", title: "4. Experimental Results", pageNumber: 16, level: 1 },
  { id: "sec-5", title: "5. Discussion & Benchmarks", pageNumber: 20, level: 1 },
  { id: "sec-6", title: "6. Conclusion & Future Work", pageNumber: 24, level: 1 },
];

interface OutlinePanelProps {
  activePage: number;
  onSelectSection: (pageNumber: number) => void;
}

export function OutlinePanel({ activePage, onSelectSection }: OutlinePanelProps) {
  return (
    <div className="space-y-4 p-4 select-none">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm tracking-tight text-foreground">
            Document Outline
          </h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {DOCUMENT_OUTLINE.length} Sections
        </Badge>
      </div>

      <div className="space-y-1.5">
        {DOCUMENT_OUTLINE.map((item) => {
          const isActive = activePage === item.pageNumber;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.pageNumber)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs font-medium border ${
                isActive
                  ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
                  : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              } ${item.level === 2 ? "ml-3 w-[calc(100%-0.75rem)]" : ""}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="truncate">{item.title}</span>
              </div>

              <Badge
                variant={isActive ? "default" : "outline"}
                className={`text-[10px] py-0 px-1.5 h-4 font-bold shrink-0 ${
                  isActive ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                Page {item.pageNumber}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
