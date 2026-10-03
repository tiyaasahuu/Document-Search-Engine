import { api } from "@/lib/api";
import { Token, UserCreate, UserLogin, UserResponse } from "@/types";

export const authService = {
  /**
   * Register a new user account (POST /api/v1/auth/register).
   */
  async register(payload: UserCreate): Promise<Token> {
    const response = await api.post<Token>("/auth/register", payload);
    return response.data;
  },

  /**
   * Login user with credentials (POST /api/v1/auth/login).
   */
  async login(payload: UserLogin): Promise<Token> {
    const response = await api.post<Token>("/auth/login", payload);
    return response.data;
  },

  /**
   * Get currently authenticated user profile (GET /api/v1/auth/me).
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>("/auth/me");
    return response.data;
  },
};
