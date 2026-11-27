import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Create a new event', { tag: '@api' }, () => {
  test('POST--events-9: POST /events', async ({ authedApi: { eventsApi } }) => {
    const payload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenCreateEvent'))
      .build();

    const response = await eventsApi.create_event(payload);
    const createdId = response.data.data?.id;

    try {
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(payload.title);
      expect(response.data.data.availableSeats).toBe(payload.totalSeats);
      expect(Number(response.data.data.price)).toBe(payload.price);
    } finally {
      if (createdId) {
        await eventsApi.delete_event(createdId);
      }
    }
  });
});
