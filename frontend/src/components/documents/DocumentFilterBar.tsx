"use client";

import React from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilterOption = "all" | "Indexed" | "Processing" | "Uploading" | "Failed";
export type SortOption = "newest" | "oldest" | "name";

interface DocumentFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function DocumentFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: DocumentFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border/60 shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm bg-background border-border/80"
        />
      </div>

      {/* Dropdowns Group */}
      <div className="flex items-center gap-2">
        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <Select
            value={statusFilter}
            onValueChange={(val) => onStatusFilterChange(val as StatusFilterOption)}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs font-medium bg-background">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Indexed">Indexed</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Uploading">Uploading</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5">
          <Select
            value={sortBy}
            onValueChange={(val) => onSortChange(val as SortOption)}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs font-medium bg-background">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
