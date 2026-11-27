import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { EventFilterBuilder } from '../../../src/eventhub/api/builders';

test.describe('Performance', { tag: '@api' }, () => {
  test('AC-PERF-003: API responses are timely', async ({ authedApi: { eventsApi } }) => {
    const params = new EventFilterBuilder()
      .with_page(1)
      .with_limit(5)
      .build();

    const startMs = Date.now();
    const response = await eventsApi.get_events(params);
    const elapsedMs = Date.now() - startMs;

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
