import { api } from "@/lib/api";
import { SearchResultItem } from "@/types";

export interface SearchParams {
  q: string;
  limit?: number;
  document_id?: string;
}

export const searchService = {
  /**
   * Execute semantic vector search on document chunks (GET /api/v1/search).
   */
  async searchDocuments(params: SearchParams): Promise<SearchResultItem[]> {
    const queryParams: Record<string, string | number> = {
      q: params.q,
    };

    if (params.limit !== undefined) {
      queryParams.limit = params.limit;
    }

    if (params.document_id) {
      queryParams.document_id = params.document_id;
    }

    const response = await api.get<SearchResultItem[]>("/search", {
      params: queryParams,
    });

    return response.data;
  },
};
