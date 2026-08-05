"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import { RenameModal } from "./RenameModal";
import { ViewDocumentModal } from "./ViewDocumentModal";

export type DocumentStatus = "Uploaded" | "Processing" | "Indexed" | "Failed" | "Uploading";

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: DocumentStatus;
  pages: number;
  size: string;
}

interface DocumentTableProps {
  documents: DocumentItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onUploadClick: () => void;
}

export function DocumentTable({
  documents,
  onRename,
  onDelete,
  onUploadClick,
}: DocumentTableProps) {
  const [selectedDocForRename, setSelectedDocForRename] = useState<DocumentItem | null>(null);
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);

  // Helper for Status Badges
  const renderStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "Indexed":
        return (
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Indexed</span>
          </Badge>
        );
      case "Processing":
        return (
          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Processing</span>
          </Badge>
        );
      case "Uploaded":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20 font-semibold text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span>Uploaded</span>
          </Badge>
        );
      case "Failed":
        return (
          <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20 font-semibold text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Helper for File Type Icons
  const renderFileTypeIcon = (type: string) => {
    const uppercaseType = type.toUpperCase();
    if (uppercaseType === "PDF") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-bold text-[10px]">
          PDF
        </div>
      );
    }
    if (uppercaseType === "DOCX" || uppercaseType === "DOC") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-[10px]">
          DOC
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold text-[10px]">
        {uppercaseType}
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileSpreadsheet className="h-7 w-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-foreground">
            No documents uploaded yet.
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload research papers, PDFs, or contracts to start asking questions.
          </p>
        </div>
        <Button onClick={onUploadClick} className="gap-2 shadow-xs font-semibold">
          <UploadCloud className="h-4 w-4" />
          <span>Upload Document</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">File Name</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload Date</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pages</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/60">
            {documents.map((doc) => (
              <TableRow key={doc.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                {/* File Name + Icon */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {renderFileTypeIcon(doc.type)}
                    <div className="flex flex-col min-w-0 max-w-xs sm:max-w-md">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {doc.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="text-xs font-semibold text-muted-foreground uppercase">
                  {doc.type}
                </TableCell>

                {/* Date */}
                <TableCell className="text-xs text-muted-foreground">
                  {doc.uploadDate}
                </TableCell>

                {/* Status */}
                <TableCell>{renderStatusBadge(doc.status)}</TableCell>

                {/* Pages */}
                <TableCell className="text-xs font-medium text-foreground">
                  {doc.pages > 0 ? `${doc.pages} pgs` : "—"}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => setSelectedDocForView(doc)}
                        className="cursor-pointer gap-2"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>View</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setSelectedDocForRename(doc)}
                        className="cursor-pointer gap-2"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                        <span>Rename</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rename Dialog */}
      {selectedDocForRename && (
        <RenameModal
          isOpen={Boolean(selectedDocForRename)}
          currentName={selectedDocForRename.name}
          onClose={() => setSelectedDocForRename(null)}
          onRename={(newName) => {
            onRename(selectedDocForRename.id, newName);
            setSelectedDocForRename(null);
          }}
        />
      )}

      {/* View Document Dialog */}
      {selectedDocForView && (
        <ViewDocumentModal
          isOpen={Boolean(selectedDocForView)}
          document={selectedDocForView}
          onClose={() => setSelectedDocForView(null)}
        />
      )}
    </>
  );
}
