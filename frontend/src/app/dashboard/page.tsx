"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FileText,
  Search,
  MessageSquareText,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FolderKanban,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>AI Engine v1.0</span>
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Research Intelligence Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents, query vector indexes, and generate real-time AI summaries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/search">
                <Search className="w-4 h-4" />
                <span>Search Knowledge</span>
              </Link>
            </Button>
            <Button size="sm" className="gap-2 shadow-xs" asChild>
              <Link href="/upload">
                <FileText className="w-4 h-4" />
                <span>Upload Document</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Documents
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Indexed Tokens
              </CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.42M</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className="font-medium text-foreground">Vector DB Status:</span> Active
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Conversations
              </CardTitle>
              <MessageSquareText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-emerald-500 font-medium">99.8%</span> response accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Processing Speed
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                Average latency per query
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <Link href="/documents" className="block text-inherit no-underline">
            <Card className="group border-border/60 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Document Vault</CardTitle>
                <CardDescription>
                  Store, parse, and structure research papers, PDFs, and legal briefs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">
                  Explore Documents <ArrowUpRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat" className="block text-inherit no-underline">
            <Card className="group border-border/60 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Interactive AI Chat</CardTitle>
                <CardDescription>
                  Ask questions across multiple research documents simultaneously.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">
                  Start Research Session <ArrowUpRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/search" className="block text-inherit no-underline">
            <Card className="group border-border/60 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Hybrid Search Engine</CardTitle>
                <CardDescription>
                  Perform semantic vector searches with instant citation references.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">
                  Query Engine <ArrowUpRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
