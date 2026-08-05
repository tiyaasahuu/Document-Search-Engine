"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Calendar, HardDrive, BookOpen } from "lucide-react";
import { DocumentItem } from "./DocumentTable";

interface ViewDocumentModalProps {
  isOpen: boolean;
  document: DocumentItem | null;
  onClose: () => void;
}

export function ViewDocumentModal({
  isOpen,
  document,
  onClose,
}: ViewDocumentModalProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold truncate max-w-xs">
                {document.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Document Details & Vector Index Metadata
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/40 space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> File Type
              </span>
              <p className="font-bold text-foreground uppercase">{document.type}</p>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/40 space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" /> File Size
              </span>
              <p className="font-bold text-foreground">{document.size}</p>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/40 space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Upload Date
              </span>
              <p className="font-bold text-foreground">{document.uploadDate}</p>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/40 space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Total Pages
              </span>
              <p className="font-bold text-foreground">{document.pages} Pages</p>
            </div>
          </div>

          {/* Status & Index Info */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Processing Status</span>
              <Badge variant="outline" className="capitalize">
                {document.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Chunks generated and embedded into Pinecone Vector Store.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Close Details</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
