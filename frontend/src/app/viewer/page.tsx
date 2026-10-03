"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Dynamic import with ssr: false to prevent Node.js prerender errors
const ViewerLayout = dynamic(
  () => import("@/components/pdf/ViewerLayout").then((mod) => mod.ViewerLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6.5rem)] rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-foreground">Loading Research Workspace...</p>
      </div>
    ),
  }
);

export default function ViewerPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-[calc(100vh-6.5rem)] rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground">Loading Document Viewer...</p>
          </div>
        }
      >
        <ViewerLayout />
      </Suspense>
    </AppLayout>
  );
}
