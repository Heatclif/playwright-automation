import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventFilterBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('List all events', { tag: '@api' }, () => {
  test('GET--events-8: GET /events', async ({ authedApi: { eventsApi } }) => {
    const params = new EventFilterBuilder()
      .with_page(apiTestData.events.filterData.page)
      .with_limit(apiTestData.events.filterData.limit)
      .build();

    const response = await eventsApi.get_events(params);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.pagination?.page).toBe(apiTestData.events.filterData.page);
  });
});
