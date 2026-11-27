import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { BookingBuilder, EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Create a booking (buy tickets)', { tag: '@api' }, () => {
  test('POST--bookings-4: POST /bookings', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    const eventPayload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenCreateBooking'))
      .build();
    const eventRes = await eventsApi.create_event(eventPayload);
    expect(eventRes.status).toBe(201);
    const eventId = eventRes.data.data.id;

    try {
      const bookingPayload = new BookingBuilder()
        .with_event_id(eventId)
        .with_data(apiTestData.bookings.validBooking)
        .build();

      const response = await bookingsApi.create_booking(bookingPayload);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.eventId).toBe(eventId);
      expect(response.data.data.quantity).toBe(apiTestData.bookings.validBooking.quantity);
      expect(response.data.data.status).toBe('confirmed');
      expect(response.data.data.bookingRef).toMatch(/^[A-Z]-[A-Z0-9]{6}$/);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
