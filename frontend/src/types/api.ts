export interface DocumentUploadResponse {
  success: boolean;
  document_id: string;
  filename: string;
  status: string;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  upload_time: string;
  status: string;
  file_path: string;
  total_pages?: number;
}

export interface SearchResultItem {
  document_id: string;
  original_filename?: string;
  page_number: number;
  chunk_index: number;
  text: string;
  chunk_text: string;
  similarity_score: number;
  similarity: number;
  page_width?: number;
  page_height?: number;
  bboxes?: number[][];
}

export interface RAGRequest {
  question: string;
  limit?: number;
  document_id?: string;
}

export interface RAGSourceItem {
  document_id: string;
  original_filename?: string;
  page_number: number;
  chunk_index: number;
  text: string;
  similarity_score: number;
  page_width?: number;
  page_height?: number;
  bboxes?: number[][];
}

export interface OutlineItem {
  level: number;
  title: string;
  page_number: number;
}

export interface RAGResponse {
  question: string;
  answer: string;
  sources: RAGSourceItem[];
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RAGSourceItem[] | null;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  user_id: string;
  title: string;
  document_id?: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
}

export interface ChatStreamRequest {
  message: string;
  conversation_id?: string;
  document_id?: string;
  limit?: number;
}

