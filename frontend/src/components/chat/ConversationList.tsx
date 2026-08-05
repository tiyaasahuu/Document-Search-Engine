"use client";

import React, { useState } from "react";
import { Plus, MessageSquare, Search, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  documentName: string;
}

interface ConversationListProps {
  conversations: ConversationThread[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card/60 border-r border-border/60 p-3.5 space-y-4 select-none">
      {/* Header & New Chat Button */}
      <div className="space-y-3">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 font-semibold shadow-xs justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/50 border-border/60"
          />
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <span>Recent Conversations</span>
        <span className="bg-muted px-1.5 py-0.2 rounded font-mono text-[10px]">
          {filteredConversations.length}
        </span>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No chats found
          </div>
        ) : (
          filteredConversations.map((thread) => {
            const isActive = thread.id === activeId;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectConversation(thread.id)}
                className={cn(
                  "group relative flex flex-col gap-1 p-2.5 rounded-xl transition-all cursor-pointer border",
                  isActive
                    ? "bg-primary/10 border-primary/40 shadow-xs"
                    : "border-transparent hover:bg-muted/50 hover:border-border/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageSquare
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold truncate",
                        isActive ? "text-foreground" : "text-foreground/90"
                      )}
                    >
                      {thread.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {thread.time}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1 pl-5">
                  {thread.lastMessage}
                </p>

                {/* Hover Delete Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(thread.id);
                  }}
                  className="absolute right-2 top-2 hidden group-hover:block text-muted-foreground hover:text-destructive p-1 transition-colors"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
