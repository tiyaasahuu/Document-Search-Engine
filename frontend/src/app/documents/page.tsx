"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FolderKanban, FileSpreadsheet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DocumentFilterBar, StatusFilterOption, SortOption } from "@/components/documents/DocumentFilterBar";
import { DocumentListTable } from "@/components/documents/DocumentListTable";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { DocumentItem } from "@/components/upload/DocumentTable";
import { documentService } from "@/services/documentService";
import { DocumentResponse } from "@/types";

const ITEMS_PER_PAGE = 10;

function mapResponseToItem(doc: DocumentResponse): DocumentItem {
  const extension = doc.original_filename.split(".").pop()?.toLowerCase() || "pdf";
  const sizeMB = (doc.file_size / (1024 * 1024)).toFixed(1);
  const formattedDate = doc.upload_time
    ? new Date(doc.upload_time).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  let statusVal: DocumentItem["status"] = "Processing";
  if (doc.status === "Indexed" || doc.status === "Processed") {
    statusVal = "Indexed";
  } else if (doc.status === "Failed") {
    statusVal = "Failed";
  } else if (doc.status === "Uploaded") {
    statusVal = "Uploaded";
  }

  return {
    id: doc.id,
    name: doc.original_filename,
    type: extension,
    uploadDate: formattedDate,
    status: statusVal,
    pages: 1,
    size: `${sizeMB} MB`,
  };
}

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data.map(mapResponseToItem));
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", err);
      const errMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Could not connect to backend server.";
      toast.error("Failed to fetch documents", {
        description: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Search & Filter & Sort Logic
  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by search text
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((doc) => doc.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "oldest") {
        return a.id.localeCompare(b.id);
      }
      // default: newest
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [documents, searchQuery, statusFilter, sortBy]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedDocuments.length / ITEMS_PER_PAGE));
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedDocuments, currentPage]);

  // Handlers
  const handleRename = (id: string, newName: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc))
    );
    toast.success("Renamed Successfully", {
      description: `Document renamed to "${newName}".`,
    });
  };

  const handleDownload = (doc: DocumentItem) => {
    toast.success("Download Started", {
      description: `Downloading "${doc.name}"...`,
    });
  };

  const handleDelete = (id: string) => {
    const docToDelete = documents.find((doc) => doc.id === id);
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast.success("Deleted Successfully", {
      description: docToDelete ? `"${docToDelete.name}" removed.` : "Document deleted.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
                <FolderKanban className="w-3 h-3" />
                <span>Document Repository</span>
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Documents
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage all uploaded research papers and documents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button asChild className="gap-2 shadow-xs font-semibold shrink-0">
              <Link href="/upload">
                <UploadCloud className="h-4 w-4" />
                <span>Upload Document</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <DocumentFilterBar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(s) => {
            setStatusFilter(s);
            setCurrentPage(1);
          }}
          sortBy={sortBy}
          onSortChange={(sort) => {
            setSortBy(sort);
            setCurrentPage(1);
          }}
        />

        {/* Main Content: Table or Empty State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading documents repository...</p>
          </div>
        ) : filteredAndSortedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                No documents uploaded yet
              </h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No documents match your current filter criteria."
                  : "Upload research papers, PDFs, or contracts to start querying."}
              </p>
            </div>
            <Button asChild className="gap-2 shadow-xs font-semibold">
              <Link href="/upload">
                <UploadCloud className="h-4 w-4" />
                <span>Upload Document</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DocumentListTable
              documents={paginatedDocuments}
              onRename={handleRename}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            <DocumentPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={filteredAndSortedDocuments.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
