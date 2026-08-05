"use client";

import React from "react";
import {
  FileText,
  User,
  Calendar,
  HardDrive,
  Globe,
  BookOpen,
  CheckCircle2,
  Cpu,
  Database,
  Clock,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MetadataPanel() {
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
          Research Paper
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" /> Filename
          </span>
          <span className="font-bold text-foreground truncate max-w-[180px]">
            Research_Paper_AI.pdf
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Pages
          </span>
          <span className="font-bold text-foreground">18 Pages</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary" /> Author
          </span>
          <span className="font-bold text-foreground">OpenAI Research Team</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary" /> Language
          </span>
          <span className="font-bold text-foreground">English</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Upload Date
          </span>
          <span className="font-bold text-foreground">Today</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-primary" /> File Size
          </span>
          <span className="font-bold text-foreground">2.8 MB</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> OCR Status
          </span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">
            Completed
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-primary" /> Embedding Status
          </span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">
            Completed
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-primary" /> Vector Database
          </span>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
            Indexed
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileCheck className="h-3.5 w-3.5 text-primary" /> Document Type
          </span>
          <span className="font-bold text-foreground">Research Paper</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" /> Reading Time
          </span>
          <span className="font-bold text-foreground">12 minutes</span>
        </div>
      </div>
    </div>
  );
}
