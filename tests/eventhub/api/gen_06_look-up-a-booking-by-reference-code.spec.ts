import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { BookingBuilder, EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Look up a booking by reference code', { tag: '@api' }, () => {
  test('GET--bookings-ref--ref--5: GET /bookings/ref/{ref}', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    const eventPayload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenBookingRef'))
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
      const bookingRef = createRes.data.data.bookingRef;

      const response = await bookingsApi.get_booking_by_ref(bookingRef);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.bookingRef).toBe(bookingRef);
      expect(response.data.data.eventId).toBe(eventId);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
