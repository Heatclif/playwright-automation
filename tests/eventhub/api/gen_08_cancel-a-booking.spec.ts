import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { BookingBuilder, EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Cancel a booking', { tag: '@api' }, () => {
  test('DELETE--bookings--id--7: DELETE /bookings/{id}', async ({ authedApi: { eventsApi, bookingsApi } }) => {
    const eventPayload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenCancelBooking'))
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

      const response = await bookingsApi.cancel_booking(bookingId);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
