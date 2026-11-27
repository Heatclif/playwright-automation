import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Get a single event by ID', { tag: '@api' }, () => {
  test('GET--events--id--10: GET /events/{id}', async ({ authedApi: { eventsApi } }) => {
    const payload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenGetEventById'))
      .build();
    const createRes = await eventsApi.create_event(payload);
    expect(createRes.status).toBe(201);
    const eventId = createRes.data.data.id;

    try {
      const response = await eventsApi.get_event_by_id(eventId);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(eventId);
      expect(response.data.data.title).toBe(payload.title);
    } finally {
      await eventsApi.delete_event(eventId);
    }
  });
});
