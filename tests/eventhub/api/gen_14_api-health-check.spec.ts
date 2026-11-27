import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('API health check', { tag: '@api' }, () => {
  test('GET--health-13: GET /health', async ({ api: { healthApi } }) => {
    const response = await healthApi.get_health();

    expect(response.status).toBe(200);
    expect(response.data.status).toBe(apiTestData.health.expectedStatus);
    expect(response.data.dbStatus).toBe(apiTestData.health.expectedDbStatus);
    expect(typeof response.data.timestamp).toBe('string');
  });
});
