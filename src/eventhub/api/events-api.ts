// src/eventhub/api/events-api.ts
import { ApiClient } from './api-client';
import {
  ApiResponse,
  CreateEventInput,
  EventItem,
  EventListResponse,
  EventSingleResponse,
} from './types';

export interface EventQueryParams {
  category?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * EventsApi exposes methods strictly related to Event management:
 * - GET    /events
 * - POST   /events
 * - GET    /events/:id
 * - PUT    /events/:id
 * - DELETE /events/:id
 */
export class EventsApi {
  constructor(private client: ApiClient) {}

  /**
   * Create a new event.
   * `availableSeats` will be automatically set equal to `totalSeats`.
   */
  async create_event(payload: CreateEventInput): Promise<ApiResponse<EventSingleResponse>> {
    return this.client.post<EventSingleResponse>('/events', payload);
  }

  /** CamelCase alias for create_event */
  async createEvent(payload: CreateEventInput): Promise<ApiResponse<EventSingleResponse>> {
    return this.create_event(payload);
  }

  /**
   * List events with optional filters (category, city, search, page, limit).
   */
  async get_events(params?: EventQueryParams): Promise<ApiResponse<EventListResponse>> {
    return this.client.get<EventListResponse>('/events', { params: params as Record<string, any> });
  }

  /** CamelCase alias for get_events */
  async getEvents(params?: EventQueryParams): Promise<ApiResponse<EventListResponse>> {
    return this.get_events(params);
  }

  /**
   * Fetch a single event by numeric ID.
   */
  async get_event_by_id(id: number): Promise<ApiResponse<EventSingleResponse>> {
    return this.client.get<EventSingleResponse>(`/events/${id}`);
  }

  /** CamelCase alias for get_event_by_id */
  async getEventById(id: number): Promise<ApiResponse<EventSingleResponse>> {
    return this.get_event_by_id(id);
  }

  /**
   * Update an existing event by ID.
   */
  async update_event(
    id: number,
    payload: Partial<CreateEventInput>
  ): Promise<ApiResponse<EventSingleResponse>> {
    return this.client.put<EventSingleResponse>(`/events/${id}`, payload);
  }

  /** CamelCase alias for update_event */
  async updateEvent(
    id: number,
    payload: Partial<CreateEventInput>
  ): Promise<ApiResponse<EventSingleResponse>> {
    return this.update_event(id, payload);
  }

  /**
   * Permanently delete an event by ID.
   */
  async delete_event(id: number): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.client.delete<{ success: boolean; message?: string }>(`/events/${id}`);
  }

  /** CamelCase alias for delete_event */
  async deleteEvent(id: number): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.delete_event(id);
  }
}
