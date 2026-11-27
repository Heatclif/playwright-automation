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
      const eventBefore = await eventsApi.get_event_by_id(eventId);
      const seatsBefore = eventBefore.data.data.availableSeats;

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

      const getAfter = await bookingsApi.get_booking_by_id(bookingId);
      if (getAfter.status === 200) {
        expect(getAfter.data.data.status).toBe('cancelled');
      } else {
        expect(getAfter.status).toBe(404);
      }

      const eventAfter = await eventsApi.get_event_by_id(eventId);
      expect(eventAfter.status).toBe(200);
      expect(eventAfter.data.data.availableSeats).toBe(seatsBefore);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
