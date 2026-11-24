// src/eventhub/api/builders/booking-builder.ts
import { CreateBookingInput } from '../types';
import { BookingQueryParams } from '../bookings-api';

/**
 * Fluent builder for constructing Booking payloads.
 */
export class BookingBuilder {
  private payload: Partial<CreateBookingInput> = {};

  with_event_id(eventId: number): this {
    this.payload.eventId = eventId;
    return this;
  }

  withEventId(eventId: number): this {
    return this.with_event_id(eventId);
  }

  with_customer_name(name: string): this {
    this.payload.customerName = name;
    return this;
  }

  withCustomerName(name: string): this {
    return this.with_customer_name(name);
  }

  with_customer_email(email: string): this {
    this.payload.customerEmail = email;
    return this;
  }

  withCustomerEmail(email: string): this {
    return this.with_customer_email(email);
  }

  with_customer_phone(phone: string): this {
    this.payload.customerPhone = phone;
    return this;
  }

  withCustomerPhone(phone: string): this {
    return this.with_customer_phone(phone);
  }

  with_quantity(quantity: number): this {
    this.payload.quantity = quantity;
    return this;
  }

  withQuantity(quantity: number): this {
    return this.with_quantity(quantity);
  }

  with_data(data: Partial<CreateBookingInput>): this {
    this.payload = { ...this.payload, ...data };
    return this;
  }

  withData(data: Partial<CreateBookingInput>): this {
    return this.with_data(data);
  }

  without_field(field: keyof CreateBookingInput): this {
    delete this.payload[field];
    return this;
  }

  withoutField(field: keyof CreateBookingInput): this {
    return this.without_field(field);
  }

  build(): CreateBookingInput {
    return { ...this.payload } as CreateBookingInput;
  }
}

/**
 * Fluent builder for building Booking list query parameters (filters & pagination).
 */
export class BookingFilterBuilder {
  private params: BookingQueryParams = {};

  with_event_id(eventId: number): this {
    this.params.eventId = eventId;
    return this;
  }

  withEventId(eventId: number): this {
    return this.with_event_id(eventId);
  }

  with_status(status: 'confirmed' | 'cancelled' | string): this {
    this.params.status = status;
    return this;
  }

  withStatus(status: 'confirmed' | 'cancelled' | string): this {
    return this.with_status(status);
  }

  with_page(page: number): this {
    this.params.page = page;
    return this;
  }

  withPage(page: number): this {
    return this.with_page(page);
  }

  with_limit(limit: number): this {
    this.params.limit = limit;
    return this;
  }

  withLimit(limit: number): this {
    return this.with_limit(limit);
  }

  with_data(data: Partial<BookingQueryParams>): this {
    this.params = { ...this.params, ...data };
    return this;
  }

  withData(data: Partial<BookingQueryParams>): this {
    return this.with_data(data);
  }

  build(): BookingQueryParams {
    return { ...this.params };
  }
}

/** Backward-compatible aliases */
export const BookingConcern = BookingBuilder;
export type BookingConcern = BookingBuilder;
export const BookingFilterConcern = BookingFilterBuilder;
export type BookingFilterConcern = BookingFilterBuilder;
