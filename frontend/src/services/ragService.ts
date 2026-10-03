import { api } from "@/lib/api";
import { RAGRequest, RAGResponse } from "@/types";

export const ragService = {
  /**
   * Submit a question to the Gemini RAG pipeline (POST /api/v1/ask).
   */
  async askQuestion(data: RAGRequest): Promise<RAGResponse> {
    const payload: RAGRequest = {
      question: data.question,
      limit: data.limit || 5,
    };

    if (data.document_id) {
      payload.document_id = data.document_id;
    }

    const response = await api.post<RAGResponse>("/ask", payload);
    return response.data;
  },
};
