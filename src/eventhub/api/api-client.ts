// src/eventhub/api/api-client.ts
import { request, test, APIRequestContext, APIResponse } from '@playwright/test';
import { ApiResponse } from './types';
import { API_BASE_URL } from '../config';

const SENSITIVE_KEYS = /^(password|token|authorization)$/i;

/** Deep-copy a value, masking sensitive fields so secrets never reach logs or reports. */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? '***' : redact(v)])
    );
  }
  return value;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: any;
}

/**
 * ApiClient handles HTTP communication (GET, POST, PUT, PATCH, DELETE)
 * using Playwright's APIRequestContext. It manages bearer authorization,
 * query parameters, JSON serialisation, and wraps responses into a typed ApiResponse.
 */
export class ApiClient {
  private context: APIRequestContext | null = null;
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl?: string, existingContext?: APIRequestContext) {
    const raw = baseUrl || API_BASE_URL;
    // Trailing slash is required so relative paths keep the `/api` segment.
    this.baseUrl = raw.replace(/\/+$/, '') + '/';

    if (existingContext) {
      this.context = existingContext;
    }
  }

  /**
   * Initialise the underlying Playwright request context if not already created.
   */
  async init(existingContext?: APIRequestContext): Promise<void> {
    if (existingContext) {
      this.context = existingContext;
    } else if (!this.context) {
      this.context = await request.newContext({
        baseURL: this.baseUrl,
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      });
    }
  }

  /** Set bearer JWT token for authenticated requests */
  set_auth_token(token: string | null): void {
    this.token = token;
  }

  /** CamelCase alias */
  setAuthToken(token: string | null): void {
    this.set_auth_token(token);
  }

  /** Retrieve the currently set bearer token */
  get_auth_token(): string | null {
    return this.token;
  }

  /** Expose the raw APIRequestContext */
  get raw_context(): APIRequestContext {
    if (!this.context) {
      throw new Error(
        'ApiClient request context is not initialized. Call await client.init() or pass context to constructor.'
      );
    }
    return this.context;
  }

  /** Strip leading slashes: a leading `/` would discard the `/api` part of baseURL. */
  private url(path: string): string {
    return path.replace(/^\/+/, '');
  }

  /** Log request/response to the console and attach them to the test report. */
  private async log(
    method: string,
    path: string,
    reqBody: unknown,
    params: unknown,
    resp: APIResponse
  ): Promise<void> {
    let respBody: unknown = '';
    try {
      const raw = await resp.text();
      try {
        respBody = redact(JSON.parse(raw));
      } catch {
        respBody = raw;
      }
    } catch {
      /* ignore */
    }
    const entry = {
      request: { method, url: resp.url(), params, body: redact(reqBody) },
      response: { status: resp.status(), body: respBody },
    };
    const text = JSON.stringify(entry, null, 2);
    console.log(`[API] ${method} ${resp.url()} -> ${resp.status()}\n${text}`);
    try {
      await test.info().attach(`${method} ${path} -> ${resp.status()}`, {
        body: text,
        contentType: 'application/json',
      });
    } catch {
      /* not running inside a test */
    }
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...extraHeaders };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async parseResponse<T>(resp: APIResponse): Promise<ApiResponse<T>> {
    let data: T;
    try {
      data = (await resp.json()) as T;
    } catch {
      data = (await resp.text()) as unknown as T;
    }

    return {
      status: resp.status(),
      ok: resp.ok(),
      data,
      headers: resp.headers(),
    };
  }

  /** Perform HTTP GET request */
  async get<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const ctx = this.raw_context;
    const resp = await ctx.get(this.url(path), {
      headers: this.buildHeaders(options?.headers),
      params: options?.params,
    });
    await this.log('GET', path, undefined, options?.params, resp);
    return this.parseResponse<T>(resp);
  }

  /** Perform HTTP POST request */
  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const ctx = this.raw_context;
    const resp = await ctx.post(this.url(path), {
      headers: this.buildHeaders({ 'Content-Type': 'application/json', ...options?.headers }),
      data: body !== undefined ? body : options?.data,
      params: options?.params,
    });
    await this.log('POST', path, body !== undefined ? body : options?.data, options?.params, resp);
    return this.parseResponse<T>(resp);
  }

  /** Perform HTTP PUT request */
  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const ctx = this.raw_context;
    const resp = await ctx.put(this.url(path), {
      headers: this.buildHeaders({ 'Content-Type': 'application/json', ...options?.headers }),
      data: body !== undefined ? body : options?.data,
      params: options?.params,
    });
    await this.log('PUT', path, body !== undefined ? body : options?.data, options?.params, resp);
    return this.parseResponse<T>(resp);
  }

  /** Perform HTTP PATCH request */
  async patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const ctx = this.raw_context;
    const resp = await ctx.patch(this.url(path), {
      headers: this.buildHeaders({ 'Content-Type': 'application/json', ...options?.headers }),
      data: body !== undefined ? body : options?.data,
      params: options?.params,
    });
    await this.log('PATCH', path, body !== undefined ? body : options?.data, options?.params, resp);
    return this.parseResponse<T>(resp);
  }

  /** Perform HTTP DELETE request */
  async delete<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const ctx = this.raw_context;
    const resp = await ctx.delete(this.url(path), {
      headers: this.buildHeaders(options?.headers),
      data: options?.data,
      params: options?.params,
    });
    await this.log('DELETE', path, options?.data, options?.params, resp);
    return this.parseResponse<T>(resp);
  }

  /** Dispose context when done */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }
}
