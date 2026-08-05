"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];

export function Dropzone({ onFileSelect, isUploading }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error("Invalid file type", {
        description: `Only PDF, DOCX, and TXT files are supported. Received .${extension}`,
      });
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error("File size exceeded", {
        description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB. "${file.name}" is ${fileSizeMB.toFixed(1)}MB.`,
      });
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none group text-center",
        isDragOver
          ? "border-primary bg-primary/10 shadow-lg scale-[1.005]"
          : "border-border/80 bg-card/60 hover:border-primary/60 hover:bg-muted/40",
        isUploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs group-hover:scale-110 transition-transform mb-4">
        <UploadCloud className="h-8 w-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-lg font-bold text-foreground">
          Drag and drop files here
        </h3>
        <p className="text-xs text-muted-foreground">
          or click below to browse from your computer
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="gap-2 shadow-xs font-semibold"
        >
          <FileText className="h-4 w-4" />
          <span>Browse Files</span>
        </Button>
      </div>

      {/* File constraints footer */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-border/40 pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground uppercase tracking-wider">Supported:</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono font-medium text-foreground">PDF</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono font-medium text-foreground">DOCX</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono font-medium text-foreground">TXT</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-muted-foreground" />
          <span>Max File Size: <strong className="text-foreground">50 MB</strong></span>
        </div>
      </div>
    </div>
  );
}
