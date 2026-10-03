import { api } from "@/lib/api";
import { DocumentResponse, DocumentUploadResponse, OutlineItem } from "@/types";

export const documentService = {
  /**
   * Upload a PDF document file to the backend API endpoint (POST /api/v1/upload).
   */
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<DocumentUploadResponse>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Fetch all uploaded documents from the backend API endpoint (GET /api/v1/documents).
   */
  async getDocuments(): Promise<DocumentResponse[]> {
    const response = await api.get<DocumentResponse[]>("/documents");
    return response.data;
  },

  /**
   * Fetch document metadata by ID (GET /api/v1/documents/{id}).
   */
  async getDocumentById(id: string): Promise<DocumentResponse> {
    const response = await api.get<DocumentResponse>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Fetch document Table of Contents / Outline bookmarks (GET /api/v1/documents/{id}/outline).
   */
  async getDocumentOutline(id: string): Promise<OutlineItem[]> {
    const response = await api.get<OutlineItem[]>(`/documents/${id}/outline`);
    return response.data;
  },

  /**
   * Fetch raw PDF file with Authorization header as a Blob and create a local Object URL.
   */
  async getDocumentFileBlob(id: string): Promise<string> {
    const response = await api.get(`/documents/${id}/file`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  },

  /**
   * Return backend streaming URL for a document's raw PDF file.
   */
  getDocumentFileUrl(id: string): string {
    const baseURL = api.defaults.baseURL || "http://localhost:8000/api/v1";
    return `${baseURL}/documents/${id}/file`;
  },
};
