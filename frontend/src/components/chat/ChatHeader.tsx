import React from "react";
import { FileText, CheckCircle2, Sparkles, Sidebar, PanelRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  currentDocument: string;
  onToggleMobileHistory?: () => void;
  onToggleCitations?: () => void;
  isCitationsOpen?: boolean;
}

export function ChatHeader({
  currentDocument,
  onToggleMobileHistory,
  onToggleCitations,
  isCitationsOpen,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-border/60 bg-card/40 backdrop-blur-xs transition-all">
      {/* Left: Mobile History Button + Active Document Info */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileHistory && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileHistory}
            className="md:hidden h-8 w-8 text-muted-foreground"
            title="Toggle History Sidebar"
          >
            <Sidebar className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="h-4 w-4" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground truncate max-w-[160px] sm:max-w-xs">
                {currentDocument}
              </span>
              <Badge
                variant="outline"
                className="gap-1 text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold shrink-0"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Indexed</span>
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Vector index active • 1,420 chunks
            </span>
          </div>
        </div>
      </div>

      {/* Right: AI Model Selector & Citations Toggle */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="gap-1 text-xs py-1 px-2.5 bg-primary/10 text-primary border-primary/20 font-semibold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Gemini 2.5 Flash</span>
        </Badge>

        {onToggleCitations && (
          <Button
            variant={isCitationsOpen ? "secondary" : "ghost"}
            size="icon"
            onClick={onToggleCitations}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Toggle Verified Citations Panel"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
