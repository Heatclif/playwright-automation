// src/eventhub/api/auth-api.ts
import { ApiClient } from './api-client';
import { ApiResponse, AuthInput, AuthResponse, MeResponse } from './types';

/**
 * AuthApi exposes methods strictly related to Auth endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - GET  /auth/me
 */
export class AuthApi {
  constructor(private client: ApiClient) {}

  /**
   * Register a new user account.
   * @param payload AuthInput { email, password, name? }
   */
  async register_user(payload: AuthInput): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<AuthResponse>('/auth/register', payload);
  }

  /** CamelCase alias for register_user */
  async register(payload: AuthInput): Promise<ApiResponse<AuthResponse>> {
    return this.register_user(payload);
  }

  /**
   * Authenticate a user and receive a JWT token.
   * @param payload AuthInput { email, password }
   */
  async login_user(payload: AuthInput): Promise<ApiResponse<AuthResponse>> {
    return this.client.post<AuthResponse>('/auth/login', payload);
  }

  /** CamelCase alias for login_user */
  async login(payload: AuthInput): Promise<ApiResponse<AuthResponse>> {
    return this.login_user(payload);
  }

  /**
   * Validate the current Bearer token and retrieve user identity.
   */
  async get_me(): Promise<ApiResponse<MeResponse>> {
    return this.client.get<MeResponse>('/auth/me');
  }

  /** CamelCase alias for get_me */
  async me(): Promise<ApiResponse<MeResponse>> {
    return this.get_me();
  }
}
