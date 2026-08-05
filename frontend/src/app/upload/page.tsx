"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dropzone } from "@/components/upload/Dropzone";
import { UploadProgress, UploadStage } from "@/components/upload/UploadProgress";
import { DocumentTable, DocumentItem } from "@/components/upload/DocumentTable";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Research_Paper_2026.pdf",
    type: "pdf",
    uploadDate: "Aug 05, 2026",
    status: "Indexed",
    pages: 24,
    size: "4.2 MB",
  },
  {
    id: "doc-2",
    name: "Executive_Summary_Q3.docx",
    type: "docx",
    uploadDate: "Aug 04, 2026",
    status: "Indexed",
    pages: 12,
    size: "1.8 MB",
  },
  {
    id: "doc-3",
    name: "Legal_Contract_Draft.pdf",
    type: "pdf",
    uploadDate: "Aug 03, 2026",
    status: "Processing",
    pages: 48,
    size: "8.6 MB",
  },
  {
    id: "doc-4",
    name: "System_Architecture.txt",
    type: "txt",
    uploadDate: "Aug 02, 2026",
    status: "Uploaded",
    pages: 5,
    size: "0.4 MB",
  },
  {
    id: "doc-5",
    name: "Corrupted_File_Test.pdf",
    type: "pdf",
    uploadDate: "Jul 29, 2026",
    status: "Failed",
    pages: 0,
    size: "0.1 MB",
  },
];

export default function UploadPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [activeUpload, setActiveUpload] = useState<{
    fileName: string;
    fileSizeMB: string;
    progress: number;
    stage: UploadStage;
    file: File;
  } | null>(null);

  // Simulated upload sequence
  const handleFileSelect = (file: File) => {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    setActiveUpload({
      fileName: file.name,
      fileSizeMB,
      progress: 10,
      stage: "uploading",
      file,
    });

    // Step 1: Uploading progress
    setTimeout(() => {
      setActiveUpload((prev) =>
        prev ? { ...prev, progress: 45, stage: "uploading" } : null
      );
    }, 600);

    // Step 2: Transition to Vector Indexing
    setTimeout(() => {
      setActiveUpload((prev) =>
        prev ? { ...prev, progress: 80, stage: "indexing" } : null
      );
    }, 1400);

    // Step 3: Completed & add to list
    setTimeout(() => {
      setActiveUpload((prev) =>
        prev ? { ...prev, progress: 100, stage: "completed" } : null
      );

      const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: extension,
        uploadDate: "Just now",
        status: "Indexed",
        pages: Math.floor(Math.random() * 30) + 1,
        size: `${fileSizeMB} MB`,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      toast.success("Upload Successful", {
        description: `"${file.name}" has been processed and indexed into vector memory.`,
      });

      // Clear progress bar after 2 seconds
      setTimeout(() => {
        setActiveUpload(null);
      }, 2500);
    }, 2200);
  };

  // Action: Rename
  const handleRename = (id: string, newName: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc))
    );
    toast.success("Renamed Successfully", {
      description: `Document name updated to "${newName}".`,
    });
  };

  // Action: Delete
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

            <Badge variant="secondary" className="text-xs font-semibold">
              {documents.length} Total Documents
            </Badge>
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
