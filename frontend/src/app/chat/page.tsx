"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConversationList, ConversationThread } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatBubble, MessageItem } from "@/components/chat/ChatBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { MessageInput } from "@/components/chat/MessageInput";
import { CitationPanel, CitationItem } from "@/components/chat/CitationCard";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageSquareText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";
import { documentService } from "@/services/documentService";
import { ConversationResponse, DocumentResponse, MessageResponse, RAGSourceItem } from "@/types";

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [activeCitations, setActiveCitations] = useState<CitationItem[]>([]);

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("all");

  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to format timestamps
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const getDocName = useCallback(
    (docId: string) => {
      const found = documents.find((d) => d.id === docId);
      return found ? found.original_filename : docId;
    },
    [documents]
  );

  // Map RAGSourceItem array to CitationItem array
  const mapSourcesToCitations = useCallback(
    (sources: RAGSourceItem[]): CitationItem[] => {
      return (sources || []).map((src, idx) => ({
        id: `cit-${src.document_id}-${src.chunk_index}-${idx}`,
        documentId: src.document_id,
        documentName: src.original_filename || getDocName(src.document_id),
        pageNumber: src.page_number,
        snippet: src.text,
        confidence: Math.round((src.similarity_score || 0) * 100),
        pageWidth: src.page_width,
        pageHeight: src.page_height,
        bboxes: src.bboxes,
      }));
    },
    [getDocName]
  );

  // Load document list for document filter dropdown
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await documentService.getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to load documents for chat filter:", err);
      }
    }
    loadDocs();
  }, []);

  // Fetch user conversations from backend on mount
  const refreshConversations = useCallback(async (autoSelectId?: string) => {
    try {
      setIsLoadingList(true);
      const list = await chatService.getConversations();
      setConversations(list);

      if (autoSelectId) {
        setActiveThreadId(autoSelectId);
      } else if (list.length > 0 && !activeThreadId) {
        setActiveThreadId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      toast.error("Could not load conversation history");
    } finally {
      setIsLoadingList(false);
    }
  }, [activeThreadId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);


  // Fetch active conversation detail whenever activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) {
      setActiveMessages([]);
      setActiveCitations([]);
      return;
    }

    async function loadDetail() {
      try {
        setIsLoadingDetail(true);
        const detail = await chatService.getConversationDetail(activeThreadId!);

        // Map backend messages to frontend MessageItem
        const mappedMsgs: MessageItem[] = detail.messages.map((m: MessageResponse) => ({
          id: m.id,
          sender: m.role === "user" ? "user" : "ai",
          content: m.content,
          time: formatTime(m.created_at),
          citations: m.sources ? m.sources.map((s) => ({ page: s.page_number, snippet: s.text })) : undefined,
        }));

        setActiveMessages(mappedMsgs);

        // Find latest assistant message with sources to populate citation panel
        const assistantMsgsWithSources = detail.messages.filter(
          (m) => m.role === "assistant" && m.sources && m.sources.length > 0
        );
        if (assistantMsgsWithSources.length > 0) {
          const latestSources = assistantMsgsWithSources[assistantMsgsWithSources.length - 1].sources || [];
          setActiveCitations(mapSourcesToCitations(latestSources));
        } else {
          setActiveCitations([]);
        }
      } catch (err) {
        console.error("Failed to load conversation detail:", err);
        toast.error("Failed to load message history");
      } finally {
        setIsLoadingDetail(false);
      }
    }

    loadDetail();
  }, [activeThreadId, mapSourcesToCitations]);

  // Auto-scroll message container to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, activeThreadId, isGenerating]);

  // Handle New Chat
  const handleNewChat = async () => {
    try {
      const docFilter = selectedDocId !== "all" ? selectedDocId : undefined;
      const newConv = await chatService.createConversation("New Research Session", docFilter);

      setConversations((prev) => [newConv, ...prev]);
      setActiveThreadId(newConv.id);
      setActiveMessages([
        {
          id: `welcome-${newConv.id}`,
          sender: "ai",
          content: "Started new research chat session. Ask a question to generate a grounded RAG answer.",
          time: "Just now",
        },
      ]);
      setActiveCitations([]);
      setMobileHistoryOpen(false);
      toast.success("Created new research chat session");
    } catch (err) {
      console.error("Failed to create new chat:", err);
      toast.error("Failed to create new conversation");
    }
  };

  // Handle Delete Chat
  const handleDeleteChat = async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeThreadId === id) {
        setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success("Chat session deleted");
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      toast.error("Failed to delete chat session");
    }
  };

  // Handle Send Message with SSE Real-time Streaming
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-temp-${Date.now()}`;
    const aiMsgId = `ai-stream-${Date.now()}`;

    const userMsg: MessageItem = {
      id: userMsgId,
      sender: "user",
      content: text.trim(),
      time: timeStr,
    };

    // Append user message and empty placeholder AI message immediately
    setActiveMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: aiMsgId,
        sender: "ai",
        content: "",
        time: timeStr,
      },
    ]);

    setIsGenerating(true);

    let currentConvId = activeThreadId;
    let accumulatedContent = "";

    const docFilter = selectedDocId !== "all" ? selectedDocId : undefined;

    await chatService.streamChatMessage(
      {
        message: text.trim(),
        conversation_id: currentConvId || undefined,
        document_id: docFilter,
        limit: 5,
      },
      {
        onConversation: (convData) => {
          currentConvId = convData.conversation_id;
          setActiveThreadId(convData.conversation_id);
          refreshConversations(convData.conversation_id);
        },
        onSources: (sources) => {
          const citations = mapSourcesToCitations(sources);
          setActiveCitations(citations);

          setActiveMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, citations: citations.map((c) => ({ page: c.pageNumber, snippet: c.snippet })) }
                : msg
            )
          );
        },
        onToken: (token) => {
          accumulatedContent += token;
          setActiveMessages((prev) =>
            prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: accumulatedContent } : msg))
          );
        },
        onDone: () => {
          setIsGenerating(false);
          refreshConversations(currentConvId || undefined);
        },
        onError: (errDetail) => {
          setIsGenerating(false);
          toast.error("RAG Stream Error", { description: errDetail });

          setActiveMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    content: msg.content || `⚠️ **Error**: ${errDetail}`,
                  }
                : msg
            )
          );
        },
      }
    );
  };

  // Convert backend ConversationResponse list to ConversationThread format for list component
  const conversationThreads: ConversationThread[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    lastMessage: c.last_message || "No messages yet",
    time: formatTime(c.updated_at),
    documentName: c.document_id ? getDocName(c.document_id) : "All Documents",
  }));

  const activeThread = conversations.find((c) => c.id === activeThreadId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-6.5rem)] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* LEFT COLUMN: Desktop Conversation History Sidebar (300px) */}
        <div className="hidden md:block w-[300px] shrink-0 h-full">
          {isLoadingList ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading conversations...</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversationThreads}
              activeId={activeThreadId || ""}
              onSelectConversation={setActiveThreadId}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteChat}
            />
          )}
        </div>

        {/* Mobile History Drawer Sheet */}
        <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
          <SheetContent side="left" className="p-0 w-80 border-r border-border">
            <ConversationList
              conversations={conversationThreads}
              activeId={activeThreadId || ""}
              onSelectConversation={(id) => {
                setActiveThreadId(id);
                setMobileHistoryOpen(false);
              }}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteChat}
            />
          </SheetContent>
        </Sheet>

        {/* CENTER COLUMN: Main Chat Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-background/50">
          {/* Header with Document Filter Dropdown */}
          <ChatHeader
            currentDocument={activeThread ? getDocName(activeThread.document_id || "all") : "All Documents"}
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocId={setSelectedDocId}
            onToggleMobileHistory={() => setMobileHistoryOpen(true)}
            onToggleCitations={() => setCitationsOpen((prev) => !prev)}
            isCitationsOpen={citationsOpen}
          />

          {/* Conversation Stream or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground text-xs">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading messages...</span>
              </div>
            ) : conversations.length === 0 && activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquareText className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-lg font-bold">Start chatting with your uploaded documents.</h3>
                  <p className="text-xs text-muted-foreground">
                    Ask any question to retrieve vector context and stream Gemini answers in real-time.
                  </p>
                </div>
                <Button onClick={handleNewChat} className="gap-2 font-semibold shadow-xs">
                  <Plus className="h-4 w-4" />
                  <span>Start New Chat</span>
                </Button>
              </div>
            ) : (
              <>
                {activeMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onRegenerate={() => handleSendMessage(msg.content)}
                  />
                ))}

                {isGenerating && activeMessages.length > 0 && !activeMessages[activeMessages.length - 1].content && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Area: Suggested Prompts & Message Input */}
          <div className="p-4 border-t border-border/60 bg-card/40 backdrop-blur-xs space-y-2">
            <SuggestedQuestions onSelectPrompt={handleSendMessage} />
            <MessageInput onSendMessage={handleSendMessage} disabled={isGenerating} />
          </div>
        </div>

        {/* RIGHT COLUMN: Citation Panel (320px) */}
        {citationsOpen && (
          <div className="hidden lg:block w-[320px] shrink-0 h-full">
            <CitationPanel citations={activeCitations} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
