// src/eventhub/api/builders/health-builder.ts
import { RequestOptions } from '../api-client';

/**
 * Fluent builder for health and config requests (e.g. headers, custom request options).
 */
export class HealthBuilder {
  private options: RequestOptions = {};

  with_custom_header(key: string, value: string): this {
    if (!this.options.headers) {
      this.options.headers = {};
    }
    this.options.headers[key] = value;
    return this;
  }

  withCustomHeader(key: string, value: string): this {
    return this.with_custom_header(key, value);
  }

  with_headers(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    return this.with_headers(headers);
  }

  build(): RequestOptions {
    return { ...this.options };
  }
}

/** Backward-compatible alias */
export const HealthConcern = HealthBuilder;
export type HealthConcern = HealthBuilder;
