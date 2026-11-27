import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Update an event', { tag: '@api' }, () => {
  test('PUT--events--id--11: PUT /events/{id}', async ({ authedApi: { eventsApi } }) => {
    const payload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenUpdateEvent'))
      .build();
    const createRes = await eventsApi.create_event(payload);
    expect(createRes.status).toBe(201);
    const eventId = createRes.data.data.id;

    try {
      const updatePayload = new EventBuilder()
        .with_data(payload)
        .with_data(apiTestData.events.updateEventData)
        .build();

      const response = await eventsApi.update_event(eventId, updatePayload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(apiTestData.events.updateEventData.title);
      expect(Number(response.data.data.price)).toBe(apiTestData.events.updateEventData.price);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
