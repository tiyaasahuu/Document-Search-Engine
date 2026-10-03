"use client";

import React from "react";
import {
  FileText,
  Calendar,
  HardDrive,
  BookOpen,
  CheckCircle2,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentResponse } from "@/types";

interface MetadataPanelProps {
  document?: DocumentResponse | null;
}

export function MetadataPanel({ document }: MetadataPanelProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 p-4 select-none">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm tracking-tight text-foreground">
            Document Information
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
          {document?.mime_type || "PDF Document"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" /> Filename
          </span>
          <span className="font-bold text-foreground truncate max-w-[180px]" title={document?.original_filename || "N/A"}>
            {document?.original_filename || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Pages
          </span>
          <span className="font-bold text-foreground">{document?.total_pages ?? "N/A"} Pages</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Upload Date
          </span>
          <span className="font-bold text-foreground">{formatDate(document?.upload_time)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-primary" /> File Size
          </span>
          <span className="font-bold text-foreground">{formatSize(document?.file_size)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Processing Status
          </span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">
            {document?.status || "Processed"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-primary" /> Vector Database
          </span>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
            pgvector
          </Badge>
        </div>
      </div>
    </div>
  );
}
