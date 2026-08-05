"use client";

import React, { useState } from "react";
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MessageItem {
  id: string;
  sender: "user" | "ai";
  content: string;
  time: string;
  citations?: Array<{
    page: number;
    snippet: string;
  }>;
}

interface ChatBubbleProps {
  message: MessageItem;
  onRegenerate?: () => void;
}

export function ChatBubble({ message, onRegenerate }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback((prev) => (prev === type ? null : type));
    toast.success(
      type === "up" ? "Feedback recorded: Helpful" : "Feedback recorded: Needs improvement"
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl my-3 group transition-all",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs mt-0.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary border border-primary/20"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Bubble Content */}
      <div className="space-y-2 min-w-0">
        <div
          className={cn(
            "rounded-2xl p-4 text-sm leading-relaxed shadow-xs border transition-all",
            isUser
              ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
              : "bg-card text-card-foreground border-border/80 rounded-tl-none"
          )}
        >
          {/* Render formatted message content */}
          <div className="space-y-3 whitespace-pre-wrap font-sans break-words">
            {message.content}
          </div>

          {/* Citations Tag inside bubble if present */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-primary" /> Verified Citations:
              </span>
              {message.citations.map((c, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] bg-primary/5 text-primary border-primary/30 cursor-pointer hover:bg-primary/15 transition-colors"
                >
                  Page {c.page}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Message Footer Actions (AI Messages) */}
        {!isUser && (
          <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
            <span>{message.time}</span>

            <div className="flex items-center gap-1 border-l border-border/60 pl-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Copy message"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </Button>

              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRegenerate}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Regenerate response"
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback("up")}
                className={cn(
                  "h-6 w-6 transition-colors",
                  feedback === "up" ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"
                )}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback("down")}
                className={cn(
                  "h-6 w-6 transition-colors",
                  feedback === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
