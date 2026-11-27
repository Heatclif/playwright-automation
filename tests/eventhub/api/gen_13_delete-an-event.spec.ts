import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Delete an event', { tag: '@api' }, () => {
  test('DELETE--events--id--12: DELETE /events/{id}', async ({ authedApi: { eventsApi } }) => {
    const payload = new EventBuilder()
      .with_data(apiTestData.events.generateUniqueEvent('GenDeleteEvent'))
      .build();
    const createRes = await eventsApi.create_event(payload);
    expect(createRes.status).toBe(201);
    const eventId = createRes.data.data.id;

    const response = await eventsApi.delete_event(eventId);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    const getAfter = await eventsApi.get_event_by_id(eventId);
    expect(getAfter.status).toBe(404);
  });
});
