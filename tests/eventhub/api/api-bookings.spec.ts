// tests/eventhub/api/api-bookings.spec.ts
import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventBuilder } from '../../../src/eventhub/api/builders/event-builder';
import { BookingBuilder, BookingFilterBuilder } from '../../../src/eventhub/api/builders/booking-builder';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Bookings API @api_bookings', () => {
  test('creates a booking successfully and calculates correct total price', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    // 1. Create a prerequisite event
    const eventData = apiTestData.events.generateUniqueEvent('Booking Target Event');
    const eventPayload = new EventBuilder()
      .with_title(eventData.title)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .with_price(eventData.price)
      .with_total_seats(eventData.totalSeats)
      .build();

    const eventRes = await eventsApi.create_event(eventPayload);
    expect(eventRes.status).toBe(201);
    const eventId = eventRes.data.data.id;
    const ticketPrice = eventRes.data.data.price;

    // 2. Obtain booking data and pass into BookingBuilder
    const bookingValues = apiTestData.bookings.validBooking;
    const bookingPayload = new BookingBuilder()
      .with_event_id(eventId)
      .with_customer_name(bookingValues.customerName)
      .with_customer_email(bookingValues.customerEmail)
      .with_customer_phone(bookingValues.customerPhone)
      .with_quantity(bookingValues.quantity)
      .build();

    // 3. Make booking call
    const bookingRes = await bookingsApi.create_booking(bookingPayload);

    // 4. Assert response
    expect(bookingRes.status).toBe(201);
    expect(bookingRes.data.success).toBe(true);
    expect(bookingRes.data.data.status).toBe('confirmed');
    expect(bookingRes.data.data.bookingRef).toMatch(/^[A-Z]-[A-Z0-9]{6}$/);
    // API returns prices as strings (e.g. "1998"), so compare numerically
    expect(Number(bookingRes.data.data.totalPrice)).toBe(Number(ticketPrice) * bookingValues.quantity);
  });

  test('decrements available seats atomically after booking', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    // 1. Create event with known seat count
    const totalSeats = 25;
    const eventPayload = new EventBuilder()
      .with_title(`Seat Test Event ${Date.now()}`)
      .with_category('Workshop')
      .with_venue('Room 101')
      .with_city('Bangalore')
      .with_event_date('2026-11-25T10:00:00.000Z')
      .with_price(500)
      .with_total_seats(totalSeats)
      .build();

    const eventRes = await eventsApi.create_event(eventPayload);
    const eventId = eventRes.data.data.id;
    expect(eventRes.data.data.availableSeats).toBe(totalSeats);

    // 2. Book 3 seats
    const bookedQty = 3;
    const bookingValues = apiTestData.bookings.validBooking;
    const bookingPayload = new BookingBuilder()
      .with_event_id(eventId)
      .with_customer_name(bookingValues.customerName)
      .with_customer_email(bookingValues.customerEmail)
      .with_customer_phone(bookingValues.customerPhone)
      .with_quantity(bookedQty)
      .build();

    const bookRes = await bookingsApi.create_booking(bookingPayload);
    expect(bookRes.status).toBe(201);

    // 3. Verify event availableSeats is decremented
    const updatedEventRes = await eventsApi.get_event_by_id(eventId);
    expect(updatedEventRes.status).toBe(200);
    expect(updatedEventRes.data.data.availableSeats).toBe(totalSeats - bookedQty);
  });

  test('retrieves a booking by reference code (GET /bookings/ref/:ref)', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    // 1. Create event & booking
    const eventData = apiTestData.events.generateUniqueEvent('Ref Lookup Event');
    const eventRes = await eventsApi.create_event(
      new EventBuilder().with_data(eventData).build()
    );
    const eventId = eventRes.data.data.id;

    const bookingValues = apiTestData.bookings.singleTicketBooking;
    const bookingPayload = new BookingBuilder()
      .with_event_id(eventId)
      .with_customer_name(bookingValues.customerName)
      .with_customer_email(bookingValues.customerEmail)
      .with_customer_phone(bookingValues.customerPhone)
      .with_quantity(bookingValues.quantity)
      .build();

    const bookRes = await bookingsApi.create_booking(bookingPayload);
    expect(bookRes.status).toBe(201);
    const refCode = bookRes.data.data.bookingRef;

    // 2. Fetch by reference code
    const refRes = await bookingsApi.get_booking_by_ref(refCode);

    // 3. Assert correctness
    expect(refRes.status).toBe(200);
    expect(refRes.data.success).toBe(true);
    expect(refRes.data.data.bookingRef).toBe(refCode);
    expect(refRes.data.data.customerName).toBe(bookingValues.customerName);
  });

  test('returns paginated list of bookings with status filter', async ({ authedApi: { bookingsApi } }) => {
    // 1. Build filter query params using BookingFilterBuilder
    const filterValues = apiTestData.bookings.filterData;
    const queryParams = new BookingFilterBuilder()
      .with_status(filterValues.status)
      .with_limit(filterValues.limit)
      .with_page(filterValues.page)
      .build();

    // 2. Request bookings list
    const response = await bookingsApi.get_bookings(queryParams);

    // 3. Assert response structure
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);

    for (const booking of response.data.data) {
      expect(booking.status).toBe(filterValues.status);
    }
  });

  test('cancels booking and atomically restores available seats', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    // 1. Create event with 10 seats
    const totalSeats = 10;
    const eventData = apiTestData.events.generateUniqueEvent('Cancel Restore Event');
    const eventRes = await eventsApi.create_event(
      new EventBuilder().with_data(eventData).with_total_seats(totalSeats).build()
    );
    const eventId = eventRes.data.data.id;

    // 2. Book 2 seats -> remaining seats = 8
    const qty = 2;
    const bookingValues = apiTestData.bookings.validBooking;
    const bookingPayload = new BookingBuilder()
      .with_event_id(eventId)
      .with_customer_name(bookingValues.customerName)
      .with_customer_email(bookingValues.customerEmail)
      .with_customer_phone(bookingValues.customerPhone)
      .with_quantity(qty)
      .build();

    const bookRes = await bookingsApi.create_booking(bookingPayload);
    expect(bookRes.status).toBe(201);
    const bookingId = bookRes.data.data.id;

    // 3. Cancel booking
    const cancelRes = await bookingsApi.cancel_booking(bookingId);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.data.success).toBe(true);

    // 4. Verify seats restored to original totalSeats
    const verifyEvent = await eventsApi.get_event_by_id(eventId);
    expect(verifyEvent.status).toBe(200);
    expect(verifyEvent.data.data.availableSeats).toBe(totalSeats);
  });

  test('rejects booking when quantity exceeds maximum allowed (10)', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    // 1. Create an event
    const eventData = apiTestData.events.generateUniqueEvent('Max Seat Event');
    const eventRes = await eventsApi.create_event(
      new EventBuilder().with_data(eventData).with_total_seats(100).build()
    );
    const eventId = eventRes.data.data.id;

    // 2. Obtain exceedsMax data from data layer (quantity: 11)
    const invalidBooking = apiTestData.bookings.exceedsMaxQuantityBooking;
    const payload = new BookingBuilder()
      .with_event_id(eventId)
      .with_customer_name(invalidBooking.customerName)
      .with_customer_email(invalidBooking.customerEmail)
      .with_customer_phone(invalidBooking.customerPhone)
      .with_quantity(invalidBooking.quantity)
      .build();

    // 3. Call API
    const response = await bookingsApi.create_booking(payload);

    // 4. Assert boundary rejection
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });
});
