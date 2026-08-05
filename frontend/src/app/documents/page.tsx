"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FolderKanban, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { DocumentFilterBar, StatusFilterOption, SortOption } from "@/components/documents/DocumentFilterBar";
import { DocumentListTable } from "@/components/documents/DocumentListTable";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { DocumentItem } from "@/components/upload/DocumentTable";

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "research_paper.pdf",
    type: "pdf",
    uploadDate: "Aug 05, 2026",
    status: "Indexed",
    pages: 32,
    size: "4.8 MB",
  },
  {
    id: "doc-2",
    name: "contract.pdf",
    type: "pdf",
    uploadDate: "Aug 04, 2026",
    status: "Indexed",
    pages: 14,
    size: "2.1 MB",
  },
  {
    id: "doc-3",
    name: "medical_report.pdf",
    type: "pdf",
    uploadDate: "Aug 03, 2026",
    status: "Processing",
    pages: 28,
    size: "5.4 MB",
  },
  {
    id: "doc-4",
    name: "thesis.pdf",
    type: "pdf",
    uploadDate: "Aug 02, 2026",
    status: "Indexed",
    pages: 110,
    size: "18.2 MB",
  },
  {
    id: "doc-5",
    name: "financial_audit_q3.docx",
    type: "docx",
    uploadDate: "Aug 01, 2026",
    status: "Uploading",
    pages: 8,
    size: "1.2 MB",
  },
  {
    id: "doc-6",
    name: "corrupted_dataset.txt",
    type: "txt",
    uploadDate: "Jul 28, 2026",
    status: "Failed",
    pages: 0,
    size: "0.2 MB",
  },
  {
    id: "doc-7",
    name: "deep_learning_survey.pdf",
    type: "pdf",
    uploadDate: "Jul 25, 2026",
    status: "Indexed",
    pages: 45,
    size: "7.9 MB",
  },
];

const ITEMS_PER_PAGE = 5;

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

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
  const totalPages = Math.ceil(filteredAndSortedDocuments.length / ITEMS_PER_PAGE);
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

          <Button asChild className="gap-2 shadow-xs font-semibold shrink-0">
            <Link href="/upload">
              <UploadCloud className="h-4 w-4" />
              <span>Upload Document</span>
            </Link>
          </Button>
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
        {filteredAndSortedDocuments.length === 0 ? (
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
