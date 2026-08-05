"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  MessageSquareText,
  Search,
  FileSpreadsheet,
  Settings,
  HardDrive,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Upload Document",
    href: "/upload",
    icon: UploadCloud,
    badge: "New",
  },
  {
    title: "My Documents",
    href: "/documents",
    icon: FolderKanban,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquareText,
    badge: "AI",
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
  },
  {
    title: "Summaries",
    href: "/summaries",
    icon: FileSpreadsheet,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col justify-between h-full bg-card border-r border-border/60 p-4 transition-all w-64 shrink-0",
        className
      )}
    >
      {/* Navigation Links */}
      <div className="space-y-6">
        <div className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 h-4 border-none font-semibold",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / Usage Widget */}
      <div className="mt-auto pt-6 space-y-4">
        <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <HardDrive className="h-3.5 w-3.5 text-primary" />
              <span>Storage Used</span>
            </div>
            <span className="font-semibold text-foreground">3.2 / 5 GB</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[64%] rounded-full bg-primary transition-all" />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-muted-foreground">Pro Plan</span>
            <Link
              href="/settings"
              className="font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              <Sparkles className="h-3 w-3" />
              Upgrade
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
