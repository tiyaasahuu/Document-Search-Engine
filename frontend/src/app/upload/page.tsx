"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dropzone } from "@/components/upload/Dropzone";
import { UploadProgress, UploadStage } from "@/components/upload/UploadProgress";
import { DocumentTable, DocumentItem } from "@/components/upload/DocumentTable";
import { documentService } from "@/services/documentService";
import { DocumentResponse } from "@/types";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function UploadPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeUpload, setActiveUpload] = useState<{
    fileName: string;
    fileSizeMB: string;
    progress: number;
    stage: UploadStage;
    file: File;
  } | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data.map(mapResponseToItem));
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", err);
      const errMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Could not connect to backend server.";
      toast.error("Failed to load documents", {
        description: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Actual backend upload sequence
  const handleFileSelect = async (file: File) => {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    setActiveUpload({
      fileName: file.name,
      fileSizeMB,
      progress: 25,
      stage: "uploading",
      file,
    });

    try {
      setActiveUpload((prev) => (prev ? { ...prev, progress: 60, stage: "indexing" } : null));

      await documentService.uploadDocument(file);

      setActiveUpload((prev) => (prev ? { ...prev, progress: 100, stage: "completed" } : null));

      toast.success("Upload Successful", {
        description: `"${file.name}" uploaded successfully and indexed.`,
      });

      // Refresh documents list from backend
      await fetchDocuments();

      setTimeout(() => {
        setActiveUpload(null);
      }, 2000);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const errMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Upload failed. Please try again.";
      toast.error("Upload Failed", {
        description: errMsg,
      });

      setActiveUpload(null);
    }
  };

  const handleRename = (id: string, newName: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc))
    );
    toast.success("Renamed Successfully", {
      description: `Document name updated to "${newName}".`,
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
        {/* Top Header Section */}
        <div className="border-b border-border/60 pb-6 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Vector Ingestion Engine</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Upload Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload PDFs, research papers, contracts, reports and other supported files for AI analysis.
          </p>
        </div>

        {/* Main Upload Dropzone */}
        <div className="space-y-4">
          <Dropzone
            onFileSelect={handleFileSelect}
            isUploading={Boolean(activeUpload && activeUpload.stage !== "completed")}
          />

          {/* Active Upload Progress Bar */}
          {activeUpload && (
            <UploadProgress
              fileName={activeUpload.fileName}
              fileSizeMB={activeUpload.fileSizeMB}
              progress={activeUpload.progress}
              stage={activeUpload.stage}
              onCancel={() => setActiveUpload(null)}
            />
          )}
        </div>

        {/* Recent Uploads Table */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recent Uploads</h2>
              <p className="text-xs text-muted-foreground">
                Manage and view processing status for your ingested documents.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDocuments}
                disabled={isLoading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Badge variant="secondary" className="text-xs font-semibold">
                {documents.length} Total Documents
              </Badge>
            </div>
          </div>

          <DocumentTable
            documents={documents}
            onRename={handleRename}
            onDelete={handleDelete}
            onUploadClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
