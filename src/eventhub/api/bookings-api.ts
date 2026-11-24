// src/eventhub/api/bookings-api.ts
import { ApiClient } from './api-client';
import {
  ApiResponse,
  BookingListResponse,
  BookingSingleResponse,
  CancelBookingResponse,
  CreateBookingInput,
} from './types';

export interface BookingQueryParams {
  eventId?: number;
  status?: 'confirmed' | 'cancelled' | string;
  page?: number;
  limit?: number;
}

/**
 * BookingsApi exposes methods strictly related to Ticket Bookings:
 * - POST   /bookings
 * - GET    /bookings
 * - GET    /bookings/ref/:ref
 * - GET    /bookings/:id
 * - DELETE /bookings/:id
 */
export class BookingsApi {
  constructor(private client: ApiClient) {}

  /**
   * Create a new booking for an event.
   * Decrements available seats atomically.
   */
  async create_booking(payload: CreateBookingInput): Promise<ApiResponse<BookingSingleResponse>> {
    return this.client.post<BookingSingleResponse>('/bookings', payload);
  }

  /** CamelCase alias for create_booking */
  async createBooking(payload: CreateBookingInput): Promise<ApiResponse<BookingSingleResponse>> {
    return this.create_booking(payload);
  }

  /**
   * List bookings with optional filters (eventId, status, page, limit).
   */
  async get_bookings(params?: BookingQueryParams): Promise<ApiResponse<BookingListResponse>> {
    return this.client.get<BookingListResponse>('/bookings', {
      params: params as Record<string, any>,
    });
  }

  /** CamelCase alias for get_bookings */
  async getBookings(params?: BookingQueryParams): Promise<ApiResponse<BookingListResponse>> {
    return this.get_bookings(params);
  }

  /**
   * Fetch a booking by its unique reference code (e.g. EVT-XXXXXX).
   */
  async get_booking_by_ref(ref: string): Promise<ApiResponse<BookingSingleResponse>> {
    return this.client.get<BookingSingleResponse>(`/bookings/ref/${ref}`);
  }

  /** CamelCase alias for get_booking_by_ref */
  async getBookingByRef(ref: string): Promise<ApiResponse<BookingSingleResponse>> {
    return this.get_booking_by_ref(ref);
  }

  /**
   * Fetch a booking by numeric ID.
   */
  async get_booking_by_id(id: number): Promise<ApiResponse<BookingSingleResponse>> {
    return this.client.get<BookingSingleResponse>(`/bookings/${id}`);
  }

  /** CamelCase alias for get_booking_by_id */
  async getBookingById(id: number): Promise<ApiResponse<BookingSingleResponse>> {
    return this.get_booking_by_id(id);
  }

  /**
   * Cancel (delete) a booking and restore available seats.
   */
  async cancel_booking(id: number): Promise<ApiResponse<CancelBookingResponse>> {
    return this.client.delete<CancelBookingResponse>(`/bookings/${id}`);
  }

  /** CamelCase alias for cancel_booking */
  async cancelBooking(id: number): Promise<ApiResponse<CancelBookingResponse>> {
    return this.cancel_booking(id);
  }
}
