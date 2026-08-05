"use client";

import React from "react";
import { FileText, Sparkles, CheckCircle2, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export type UploadStage = "uploading" | "indexing" | "completed";

interface UploadProgressProps {
  fileName: string;
  fileSizeMB: string;
  progress: number;
  stage: UploadStage;
  onCancel?: () => void;
}

export function UploadProgress({
  fileName,
  fileSizeMB,
  progress,
  stage,
  onCancel,
}: UploadProgressProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {stage === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : stage === "indexing" ? (
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSizeMB} MB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              {stage === "uploading" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Uploading...</span>
                </>
              )}
              {stage === "indexing" && (
                <>
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
                  <span className="text-amber-500 font-semibold">Indexing vectors...</span>
                </>
              )}
              {stage === "completed" && (
                <span className="text-emerald-500 font-semibold">Completed</span>
              )}
            </div>
          </div>

          {onCancel && stage !== "completed" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          )}
        </div>
      </div>

      <Progress value={progress} className="h-2 rounded-full" />
    </div>
  );
}
