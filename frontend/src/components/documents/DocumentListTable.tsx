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
  MoreVertical,
  Eye,
  Pencil,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { RenameModal } from "@/components/upload/RenameModal";
import { ViewDocumentModal } from "@/components/upload/ViewDocumentModal";
import { DocumentItem } from "@/components/upload/DocumentTable";

interface DocumentListTableProps {
  documents: DocumentItem[];
  onRename: (id: string, newName: string) => void;
  onDownload: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
}

export function DocumentListTable({
  documents,
  onRename,
  onDownload,
  onDelete,
}: DocumentListTableProps) {
  const [selectedDocForRename, setSelectedDocForRename] = useState<DocumentItem | null>(null);
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
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
      case "Uploading":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20 font-semibold text-xs">
            <FileText className="h-3.5 w-3.5 animate-pulse" />
            <span>Uploading</span>
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

  // File type icon helper
  const renderFileTypeIcon = (type: string) => {
    const uppercase = type.toUpperCase();
    if (uppercase === "PDF") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-bold text-[10px]">
          PDF
        </div>
      );
    }
    if (uppercase === "DOCX" || uppercase === "DOC") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-[10px]">
          DOC
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold text-[10px]">
        {uppercase}
      </div>
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Name</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pages</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Uploaded Date</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/60">
            {documents.map((doc) => (
              <TableRow key={doc.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                {/* Document Name */}
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

                {/* Pages */}
                <TableCell className="text-xs font-medium text-foreground">
                  {doc.pages > 0 ? `${doc.pages} pgs` : "—"}
                </TableCell>

                {/* Uploaded Date */}
                <TableCell className="text-xs text-muted-foreground">
                  {doc.uploadDate}
                </TableCell>

                {/* Status */}
                <TableCell>{renderStatusBadge(doc.status)}</TableCell>

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

                      <DropdownMenuItem
                        onClick={() => onDownload(doc)}
                        className="cursor-pointer gap-2"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>Download</span>
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

      {/* View Details Dialog */}
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
