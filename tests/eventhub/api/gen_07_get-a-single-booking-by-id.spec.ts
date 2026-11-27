import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { BookingBuilder, EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Get a single booking by ID', { tag: '@api' }, () => {
  test('GET--bookings--id--6: GET /bookings/{id}', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    const eventPayload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenBookingById'))
      .build();
    const eventRes = await eventsApi.create_event(eventPayload);
    expect(eventRes.status).toBe(201);
    const eventId = eventRes.data.data.id;

    try {
      const bookingPayload = new BookingBuilder()
        .with_event_id(eventId)
        .with_data(apiTestData.bookings.singleTicketBooking)
        .build();
      const createRes = await bookingsApi.create_booking(bookingPayload);
      expect(createRes.status).toBe(201);
      const bookingId = createRes.data.data.id;

      const response = await bookingsApi.get_booking_by_id(bookingId);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(bookingId);
      expect(response.data.data.eventId).toBe(eventId);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
