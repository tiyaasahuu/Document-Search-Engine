import { api } from "@/lib/api";
import {
  ChatStreamRequest,
  ConversationDetailResponse,
  ConversationResponse,
  RAGSourceItem,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface StreamCallbacks {
  onConversation?: (data: { conversation_id: string; title: string }) => void;
  onSources?: (sources: RAGSourceItem[]) => void;
  onToken?: (token: string) => void;
  onDone?: (data: { message_id: string; conversation_id: string }) => void;
  onError?: (error: string) => void;
}

export const chatService = {
  /**
   * Retrieves all conversation threads for authenticated user.
   */
  async getConversations(): Promise<ConversationResponse[]> {
    const res = await api.get<ConversationResponse[]>("/conversations");
    return res.data;
  },

  /**
   * Retrieves a conversation's details and full message history.
   */
  async getConversationDetail(id: string): Promise<ConversationDetailResponse> {
    const res = await api.get<ConversationDetailResponse>(`/conversations/${id}`);
    return res.data;
  },

  /**
   * Creates a new conversation thread.
   */
  async createConversation(title?: string, document_id?: string): Promise<ConversationResponse> {
    const res = await api.post<ConversationResponse>("/conversations", {
      title: title || "New Conversation",
      document_id: document_id || null,
    });
    return res.data;
  },

  /**
   * Updates title or document filter for a conversation.
   */
  async updateConversation(
    id: string,
    data: { title?: string; document_id?: string | null }
  ): Promise<ConversationResponse> {
    const res = await api.patch<ConversationResponse>(`/conversations/${id}`, data);
    return res.data;
  },

  /**
   * Deletes a conversation thread.
   */
  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  /**
   * Streams chat response over Server-Sent Events (SSE) using fetch and ReadableStream.
   */
  async streamChatMessage(req: ChatStreamRequest, callbacks: StreamCallbacks): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const response = await fetch(`${API_BASE_URL}/conversations/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = "Failed to stream chat response";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail) detail = parsed.detail;
      } catch {
        detail = errText || detail;
      }
      callbacks.onError?.(detail);
      return;
    }

    if (!response.body) {
      callbacks.onError?.("ReadableStream not supported by browser or response body empty");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by double newlines (\n\n)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // keep incomplete tail chunk in buffer

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;


          for (const line of trimmed.split("\n")) {
            if (line.startsWith("data: ")) {
              const rawData = line.slice(6).trim();
              if (!rawData) continue;
              try {
                const event = JSON.parse(rawData);
                switch (event.type) {
                  case "conversation":
                    callbacks.onConversation?.(event);
                    break;
                  case "sources":
                    callbacks.onSources?.(event.sources || []);
                    break;
                  case "token":
                    callbacks.onToken?.(event.content || "");
                    break;
                  case "done":
                    callbacks.onDone?.(event);
                    break;
                  case "error":
                    callbacks.onError?.(event.detail || "Streaming error occurred");
                    break;
                  default:
                    break;
                }
              } catch (e) {
                console.error("Error parsing SSE JSON payload:", e, rawData);
              }
            }
          }
        }
      }

      // Process any remaining tail in buffer
      if (buffer.trim().startsWith("data: ")) {
        const rawData = buffer.trim().slice(6).trim();
        try {
          const event = JSON.parse(rawData);
          if (event.type === "token") callbacks.onToken?.(event.content || "");
          if (event.type === "done") callbacks.onDone?.(event);
          if (event.type === "error") callbacks.onError?.(event.detail || "Streaming error");
        } catch {
          // ignore trailing partial json
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error reading response stream";
      callbacks.onError?.(errMsg);
    }
  },
};
