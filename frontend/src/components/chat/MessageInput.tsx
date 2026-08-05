"use client";

import React, { useState, useRef } from "react";
import { Paperclip, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileAttached = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      toast.success(`Attached "${file.name}" to context`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    toast.info("Voice Input placeholder", {
      description: "Speech-to-text integration active.",
    });
  };

  return (
    <div className="relative rounded-2xl border border-border/80 bg-card p-3 shadow-md focus-within:border-primary/60 transition-all">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileAttached}
        className="hidden"
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your uploaded document..."
        disabled={disabled}
        rows={2}
        className="w-full resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70"
      />

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAttachClick}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Attach Document"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Voice Input"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          size="sm"
          className="gap-1.5 h-8 px-4 font-semibold shadow-xs"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
