"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  MessageSquareText,
  Zap,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ViewerHeaderProps {
  documentName?: string;
  lastModified?: string;
  onGenerateSummary?: () => void;
}

export function ViewerHeader({
  documentName = "Research_Paper_AI.pdf",
  lastModified = "2 hours ago",
  onGenerateSummary,
}: ViewerHeaderProps) {
  const handleDownload = () => {
    toast.success(`Downloading "${documentName}"...`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Workspace link copied to clipboard");
  };

  const handleSummary = () => {
    if (onGenerateSummary) {
      onGenerateSummary();
    } else {
      toast.info("Generating AI Executive Summary...", {
        description: "Synthesizing key insights from 24 pages.",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs select-none">
      {/* Left: Document Info & Status Badges */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
          <FileText className="h-5 w-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-foreground truncate max-w-xs sm:max-w-md">
              {documentName}
            </h1>

            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Indexed</span>
              </Badge>

              <Badge
                variant="secondary"
                className="gap-1 text-[11px] bg-primary/10 text-primary border-primary/20 font-bold"
              >
                <Sparkles className="h-3 w-3" />
                <span>Gemini Ready</span>
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last Modified {lastModified}</span>
            </span>
            <span>•</span>
            <span>Vector store synchronized</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSummary}
          className="gap-1.5 text-xs font-semibold"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Generate Summary</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1.5 text-xs font-semibold"
        >
          <Link href="/chat">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            <span>Open Chat</span>
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleShare}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Share Workspace Link"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
