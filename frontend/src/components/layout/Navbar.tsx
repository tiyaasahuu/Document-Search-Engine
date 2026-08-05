"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sparkles,
  User,
  Settings,
  LogOut,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Menu,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { siteConfig } from "@/config/site";

interface NavbarProps {
  onMobileMenuOpen?: () => void;
}

export function Navbar({ onMobileMenuOpen }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md transition-all sm:px-6">
      {/* Left: Mobile Toggle + Logo & Project Name */}
      <div className="flex items-center gap-3">
        {onMobileMenuOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuOpen}
            className="md:hidden h-9 w-9"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base leading-tight tracking-tight text-foreground">
              {siteConfig.name}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
              AI Intelligence Engine
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents, research, insights... (⌘K)"
            className="w-full bg-muted/50 pl-9 pr-12 text-sm focus-visible:bg-background transition-colors h-9 rounded-lg"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications, User Avatar */}
      <div className="flex items-center gap-2">
        {/* Search Icon button for mobile */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Icon */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] bg-primary text-primary-foreground">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">Notifications</span>
              <Badge variant="secondary" className="text-[10px]">3 New</Badge>
            </div>
            <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
              <div className="p-3 text-xs flex items-start gap-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Document Analysis Complete</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Research_Report_2026.pdf has been indexed.</p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">2 mins ago</span>
                </div>
              </div>
              <div className="p-3 text-xs flex items-start gap-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">AI Summary Ready</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Executive summary generated for Q3 Financials.</p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">1 hour ago</span>
                </div>
              </div>
              <div className="p-3 text-xs flex items-start gap-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Storage Alert</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Your workspace is at 80% capacity.</p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">3 hours ago</span>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src="/avatar-placeholder.png" alt="Senior Engineer" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  SE
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Senior Engineer</p>
                <p className="text-xs leading-none text-muted-foreground">
                  engineer@documind.ai
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing & Usage</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
