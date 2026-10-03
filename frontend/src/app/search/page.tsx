"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sparkles, FileText, Layers, Percent, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { searchService } from "@/services/searchService";
import { documentService } from "@/services/documentService";
import { SearchResultItem, DocumentResponse } from "@/types";
import { toast } from "sonner";

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const [selectedDocId, setSelectedDocId] = useState<string>("all");
  
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch document list for filter dropdown
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await documentService.getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to load documents for search filter:", err);
      }
    }
    loadDocs();
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!query.trim()) {
        toast.error("Empty Query", {
          description: "Please enter a search query string.",
        });
        return;
      }

      setIsSearching(true);
      setErrorMessage(null);
      setHasSearched(true);

      try {
        const res = await searchService.searchDocuments({
          q: query.trim(),
          limit,
          document_id: selectedDocId !== "all" ? selectedDocId : undefined,
        });

        setResults(res);
        toast.success("Search Completed", {
          description: `Found ${res.length} matching document chunks.`,
        });
      } catch (err: unknown) {
        console.error("Semantic search failed:", err);
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to execute semantic search.";
        setErrorMessage(msg);
        toast.error("Search Failed", { description: msg });
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [query, limit, selectedDocId]
  );

  // Map document_id to original_filename helper
  const getDocumentName = (docId: string): string => {
    const found = documents.find((d) => d.id === docId);
    return found ? found.original_filename : docId;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header Section */}
        <div className="border-b border-border/60 pb-6 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>pgvector Similarity Engine</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Semantic Vector Search
          </h1>
          <p className="text-sm text-muted-foreground">
            Search document chunk embeddings using 384-dimensional cosine vector similarity (`all-MiniLM-L6-v2`).
          </p>
        </div>

        {/* Search Bar & Filter Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter concepts, topics, or exact text (e.g. 'machine learning algorithms')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-11 bg-card shadow-xs text-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-11 px-6 font-semibold gap-2 shadow-xs shrink-0 w-full sm:w-auto"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Vectors</span>
                </>
              )}
            </Button>
          </div>

          {/* Filter & Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-card border border-border/60 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Document Selector (displaying original_filename) */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Filter Document:</span>
                <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                  <SelectTrigger className="w-56 h-8 text-xs bg-background">
                    <SelectValue placeholder="All Documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.original_filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Max Results:</span>
                <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
                  <SelectTrigger className="w-24 h-8 text-xs bg-background">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasSearched && (
              <Badge variant="secondary" className="font-semibold">
                {results.length} Chunks Matched
              </Badge>
            )}
          </div>
        </form>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Results List / Grid */}
        {isSearching ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-card/60">
                <CardHeader className="py-3 px-4 border-b border-border/40">
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold">No Matching Chunks Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              No document chunks in pgvector matched your query concept. Try expanding your search terms or selecting &quot;All Documents&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((item, idx) => {
              const scorePercent = (item.similarity_score * 100).toFixed(1);
              const docName = item.original_filename || getDocumentName(item.document_id);
              const qParams = new URLSearchParams();
              qParams.set("document_id", item.document_id);
              qParams.set("page", item.page_number.toString());
              if (item.page_width) qParams.set("page_width", item.page_width.toString());
              if (item.page_height) qParams.set("page_height", item.page_height.toString());
              if (item.bboxes && item.bboxes.length > 0) qParams.set("bboxes", JSON.stringify(item.bboxes));
              if (item.text) qParams.set("highlight", item.text.slice(0, 100));
              const viewerHref = `/viewer?${qParams.toString()}`;

              return (
                <Card key={idx} className="transition-all hover:border-primary/50 shadow-xs group">
                  <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 font-medium text-xs text-foreground truncate min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold truncate">{docName}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Badge variant="outline" className="text-[11px] gap-1 font-semibold border-border">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        <span>Page {item.page_number}</span>
                        <span className="text-muted-foreground">• Chunk {item.chunk_index}</span>
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="text-xs font-bold gap-1 bg-primary/10 text-primary border border-primary/20"
                      >
                        <Percent className="h-3 w-3" />
                        <span>{scorePercent}% Match</span>
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                      >
                        <Link href={viewerHref}>
                          <span>View in Document</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap">
                      {item.text || item.chunk_text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
