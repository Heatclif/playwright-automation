// src/eventhub/api/builders/event-builder.ts
import { Category, CreateEventInput } from '../types';
import { EventQueryParams } from '../events-api';

/**
 * Fluent builder for constructing Event creation/update payloads.
 * Implements with_title(), with_description(), with_city() and related builder methods.
 */
export class EventBuilder {
  private payload: Partial<CreateEventInput> = {};

  with_title(title: string): this {
    this.payload.title = title;
    return this;
  }

  withTitle(title: string): this {
    return this.with_title(title);
  }

  with_description(description?: string): this {
    this.payload.description = description;
    return this;
  }

  withDescription(description?: string): this {
    return this.with_description(description);
  }

  with_category(category: Category | string): this {
    this.payload.category = category;
    return this;
  }

  withCategory(category: Category | string): this {
    return this.with_category(category);
  }

  with_venue(venue: string): this {
    this.payload.venue = venue;
    return this;
  }

  withVenue(venue: string): this {
    return this.with_venue(venue);
  }

  with_city(city: string): this {
    this.payload.city = city;
    return this;
  }

  withCity(city: string): this {
    return this.with_city(city);
  }

  with_event_date(eventDate: string): this {
    this.payload.eventDate = eventDate;
    return this;
  }

  withEventDate(eventDate: string): this {
    return this.with_event_date(eventDate);
  }

  with_date(date: string): this {
    return this.with_event_date(date);
  }

  with_price(price: number): this {
    this.payload.price = price;
    return this;
  }

  withPrice(price: number): this {
    return this.with_price(price);
  }

  with_total_seats(totalSeats: number): this {
    this.payload.totalSeats = totalSeats;
    return this;
  }

  withTotalSeats(totalSeats: number): this {
    return this.with_total_seats(totalSeats);
  }

  with_image_url(imageUrl?: string | null): this {
    this.payload.imageUrl = imageUrl;
    return this;
  }

  withImageUrl(imageUrl?: string | null): this {
    return this.with_image_url(imageUrl);
  }

  with_data(data: Partial<CreateEventInput>): this {
    this.payload = { ...this.payload, ...data };
    return this;
  }

  withData(data: Partial<CreateEventInput>): this {
    return this.with_data(data);
  }

  without_field(field: keyof CreateEventInput): this {
    delete this.payload[field];
    return this;
  }

  withoutField(field: keyof CreateEventInput): this {
    return this.without_field(field);
  }

  build(): CreateEventInput {
    return { ...this.payload } as CreateEventInput;
  }
}

/**
 * Fluent builder for building Event list query parameters (filters & pagination).
 */
export class EventFilterBuilder {
  private params: EventQueryParams = {};

  with_category(category: string): this {
    this.params.category = category;
    return this;
  }

  withCategory(category: string): this {
    return this.with_category(category);
  }

  with_city(city: string): this {
    this.params.city = city;
    return this;
  }

  withCity(city: string): this {
    return this.with_city(city);
  }

  with_search(search: string): this {
    this.params.search = search;
    return this;
  }

  withSearch(search: string): this {
    return this.with_search(search);
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

  with_data(data: Partial<EventQueryParams>): this {
    this.params = { ...this.params, ...data };
    return this;
  }

  withData(data: Partial<EventQueryParams>): this {
    return this.with_data(data);
  }

  build(): EventQueryParams {
    return { ...this.params };
  }
}

/** Backward-compatible aliases */
export const EventConcern = EventBuilder;
export type EventConcern = EventBuilder;
export const EventFilterConcern = EventFilterBuilder;
export type EventFilterConcern = EventFilterBuilder;
