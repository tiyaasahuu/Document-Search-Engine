"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, MessageSquareText, Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BottomActionBarProps {
  onGenerateSummary?: () => void;
}

export function BottomActionBar({ onGenerateSummary }: BottomActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleSummary = () => {
    if (onGenerateSummary) {
      onGenerateSummary();
    } else {
      toast.info("Summary generation will be available after backend integration.", {
        description: "AI Executive Summary generator is ready for API connection.",
      });
    }
  };

  const handleCopyCitation = () => {
    const citationText =
      "OpenAI Research Team (2026). Hybrid Dense-Sparse Vector Retrieval & Reranking Architecture. Research Paper, Page 12.";
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    toast.success("Citation copied to clipboard", {
      description: citationText,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportNotes = () => {
    toast.success("Exporting Notes & Citations", {
      description: "Downloaded Research_Paper_AI_Notes.md to your system.",
    });
  };

  return (
    <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur-md select-none transition-all">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-foreground">Workspace Actions:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleSummary}
          className="gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Zap className="h-3.5 w-3.5 text-amber-300" />
          <span>Generate Summary</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          asChild
          className="gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Link href="/chat">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            <span>Ask AI</span>
          </Link>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyCitation}
          className="gap-1.5 text-xs font-medium"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>Copy Citation</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportNotes}
          className="gap-1.5 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Export Notes</span>
        </Button>
      </div>
    </div>
  );
}
