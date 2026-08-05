"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { MessageSquareText, Plus } from "lucide-react";
import { toast } from "sonner";

// Initial Realistic Dummy Threads
const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: "thread-1",
    title: "Research Paper Analysis",
    lastMessage: "The paper introduces a hybrid retrieval method that improves answer accuracy...",
    time: "2m ago",
    documentName: "Research_Paper.pdf",
  },
  {
    id: "thread-2",
    title: "Machine Learning Notes",
    lastMessage: "Explain the difference between dense embeddings and sparse BM25 indices.",
    time: "1h ago",
    documentName: "ML_Handbook.pdf",
  },
  {
    id: "thread-3",
    title: "Contract Review",
    lastMessage: "Are there any indemnification clauses in section 4.2?",
    time: "3h ago",
    documentName: "Service_Contract.pdf",
  },
  {
    id: "thread-4",
    title: "Medical Report",
    lastMessage: "Summarize patient diagnosis and key lab findings.",
    time: "1d ago",
    documentName: "Medical_Report_Q3.pdf",
  },
];

// Initial Messages Map
const INITIAL_MESSAGES_MAP: Record<string, MessageItem[]> = {
  "thread-1": [
    {
      id: "m-1",
      sender: "user",
      content: "What is the main contribution of this paper?",
      time: "10:14 AM",
    },
    {
      id: "m-2",
      sender: "ai",
      content:
        "The paper introduces a novel hybrid retrieval architecture combining dense vector embeddings with sparse BM25 reranking.\n\nKey highlights include:\n• 18% improvement in prediction precision over baseline transformers\n• Sub-second response latency (1.2s average)\n• Verified source attribution with exact bounding box citations.",
      time: "10:14 AM",
      citations: [
        { page: 12, snippet: "This proposed retrieval method improves answer accuracy by combining dense vector search with reranking." },
        { page: 14, snippet: "Experimental benchmarks demonstrate an 18% gain in precision on noisy technical documents." },
      ],
    },
  ],
  "thread-2": [
    {
      id: "m-3",
      sender: "user",
      content: "Explain the difference between dense embeddings and sparse BM25 indices.",
      time: "9:00 AM",
    },
    {
      id: "m-4",
      sender: "ai",
      content:
        "Dense embeddings capture semantic meaning using continuous vector representations (e.g. OpenAI ada-002), while sparse BM25 uses term frequency and keyword matching.\n\nCombining both yields optimal recall for domain-specific terminology.",
      time: "9:01 AM",
      citations: [
        { page: 4, snippet: "Sparse BM25 excels at exact keyword matching, whereas dense vectors capture semantic context." },
      ],
    },
  ],
};

// Initial Citations Map
const INITIAL_CITATIONS_MAP: Record<string, CitationItem[]> = {
  "thread-1": [
    {
      id: "cit-1",
      documentName: "Research_Paper.pdf",
      pageNumber: 12,
      snippet: "This proposed retrieval method improves answer accuracy by combining dense vector search with reranking.",
      confidence: 98,
    },
    {
      id: "cit-2",
      documentName: "Research_Paper.pdf",
      pageNumber: 14,
      snippet: "Experimental benchmarks demonstrate an 18% gain in precision on noisy technical documents.",
      confidence: 94,
    },
  ],
  "thread-2": [
    {
      id: "cit-3",
      documentName: "ML_Handbook.pdf",
      pageNumber: 4,
      snippet: "Sparse BM25 excels at exact keyword matching, whereas dense vectors capture semantic context.",
      confidence: 96,
    },
  ],
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>(INITIAL_MESSAGES_MAP);
  const [citationsMap, setCitationsMap] = useState<Record<string, CitationItem[]>>(INITIAL_CITATIONS_MAP);

  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = conversations.find((c) => c.id === activeThreadId);
  const activeMessages = messagesMap[activeThreadId] || [];
  const activeCitations = citationsMap[activeThreadId] || [];

  // Auto-scroll message container to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeThreadId, isGenerating]);

  // Handle New Chat
  const handleNewChat = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ConversationThread = {
      id: newId,
      title: "New Research Session",
      lastMessage: "Session initialized...",
      time: "Just now",
      documentName: "Research_Paper.pdf",
    };

    setConversations((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setMessagesMap((prev) => ({ ...prev, [newId]: [] }));
    setCitationsMap((prev) => ({ ...prev, [newId]: [] }));
    setMobileHistoryOpen(false);
    toast.success("Created new research chat session");
  };

  // Handle Delete Chat
  const handleDeleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeThreadId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) setActiveThreadId(remaining[0].id);
    }
    toast.success("Chat session deleted");
  };

  // Handle Send Message
  const handleSendMessage = (text: string) => {
    if (!text.trim() || isGenerating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: text,
      time: timeStr,
    };

    // Update messages & last message snippet
    setMessagesMap((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), userMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeThreadId
          ? { ...c, lastMessage: text, time: "Just now" }
          : c
      )
    );

    setIsGenerating(true);

    // Simulated AI response generation sequence
    setTimeout(() => {
      const aiMsg: MessageItem = {
        id: `msg-ai-${Date.now()}`,
        sender: "ai",
        content: `Based on **${activeThread?.documentName || "Research_Paper.pdf"}**, here is the synthesized answer:\n\n1. **Core Insight**: The query highlights key methodologies in vector retrieval and contextual augmentation.\n2. **Accuracy Metric**: Grounded at **98% confidence** across primary citations.\n\nWould you like me to elaborate on specific statistical parameters or generate an executive summary?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: [
          { page: 12, snippet: "The proposed retrieval method improves answer accuracy by combining dense vector search with reranking." },
        ],
      };

      const newCitation: CitationItem = {
        id: `cit-${Date.now()}`,
        documentName: activeThread?.documentName || "Research_Paper.pdf",
        pageNumber: 12,
        snippet: "The proposed retrieval method improves answer accuracy by combining dense vector search with reranking.",
        confidence: 98,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] || []), aiMsg],
      }));

      setCitationsMap((prev) => ({
        ...prev,
        [activeThreadId]: [newCitation, ...(prev[activeThreadId] || [])],
      }));

      setIsGenerating(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-6.5rem)] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* LEFT COLUMN: Desktop Conversation History Sidebar (300px) */}
        <div className="hidden md:block w-[300px] shrink-0 h-full">
          <ConversationList
            conversations={conversations}
            activeId={activeThreadId}
            onSelectConversation={setActiveThreadId}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteChat}
          />
        </div>

        {/* Mobile History Drawer Sheet */}
        <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
          <SheetContent side="left" className="p-0 w-80 border-r border-border">
            <ConversationList
              conversations={conversations}
              activeId={activeThreadId}
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
          {/* Header */}
          <ChatHeader
            currentDocument={activeThread?.documentName || "Research_Paper.pdf"}
            onToggleMobileHistory={() => setMobileHistoryOpen(true)}
            onToggleCitations={() => setCitationsOpen((prev) => !prev)}
            isCitationsOpen={citationsOpen}
          />

          {/* Conversation Stream or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquareText className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-lg font-bold">Start chatting with your uploaded documents.</h3>
                  <p className="text-xs text-muted-foreground">
                    Select a research paper to ask questions and extract instant citations.
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

                {isGenerating && <TypingIndicator />}
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
