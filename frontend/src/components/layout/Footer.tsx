"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-background/50 px-4 py-4 backdrop-blur-xs text-xs text-muted-foreground transition-all sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Copyright & System Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground">All systems operational</span>
          </div>
          <span className="hidden sm:inline text-border">•</span>
          <span>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</span>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/docs" className="hover:text-foreground transition-colors">
            API Documentation
          </Link>
        </div>
      </div>
    </footer>
  );
}
