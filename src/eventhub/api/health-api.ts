// src/eventhub/api/health-api.ts
import { ApiClient } from './api-client';
import { ApiResponse, ConfigResponse, HealthResponse } from './types';

/**
 * HealthApi exposes methods strictly related to Health and Public Config endpoints:
 * - GET /health
 * - GET /config
 */
export class HealthApi {
  constructor(private client: ApiClient) {}

  /**
   * Check API health and database connectivity.
   */
  async get_health(): Promise<ApiResponse<HealthResponse>> {
    return this.client.get<HealthResponse>('/health');
  }

  /** CamelCase alias for get_health */
  async getHealth(): Promise<ApiResponse<HealthResponse>> {
    return this.get_health();
  }

  /**
   * Fetch public configuration feature flags.
   */
  async get_config(): Promise<ApiResponse<ConfigResponse>> {
    return this.client.get<ConfigResponse>('/config');
  }

  /** CamelCase alias for get_config */
  async getConfig(): Promise<ApiResponse<ConfigResponse>> {
    return this.get_config();
  }
}
