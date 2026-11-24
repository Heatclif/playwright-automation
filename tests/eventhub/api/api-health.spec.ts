// tests/eventhub/api/api-health.spec.ts
import { test, expect } from '../../../src/eventhub/api-fixtures';
import { HealthBuilder } from '../../../src/eventhub/api/builders/health-builder';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Health & Config API @api_health', () => {

  test('health check returns ok status and connected dbStatus', async ({ api: { healthApi } }) => {
    const response = await healthApi.get_health();

    expect(response.status).toBe(200);
    expect(response.data.status).toBe(apiTestData.health.expectedStatus);
    expect(response.data.dbStatus).toBe(apiTestData.health.expectedDbStatus);
  });

  test('health check response includes a valid ISO 8601 timestamp', async ({ api: { healthApi } }) => {
    const response = await healthApi.get_health();

    expect(response.status).toBe(200);
    expect(typeof response.data.timestamp).toBe('string');

    const timestampDate = new Date(response.data.timestamp);
    expect(isNaN(timestampDate.getTime())).toBe(false);
  });

  test('config endpoint returns public feature flags', async ({ api: { healthApi } }) => {
    const response = await healthApi.get_config();

    expect(response.status).toBe(200);
    expect(typeof response.data.showExploreLinks).toBe('boolean');
  });

  test('health check requires no authentication', async ({ api: { client, healthApi } }) => {
    // Explicitly unauthenticated
    client.set_auth_token(null);

    const response = await healthApi.get_health();

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('health check responds with JSON and accepts custom headers via HealthBuilder', async ({ api: { client } }) => {
    // 1. Obtain custom headers from data layer and build options via HealthBuilder
    const customHeaderData = apiTestData.health.customHeaders;
    const builderOptions = new HealthBuilder()
      .with_headers(customHeaderData)
      .build();

    // 2. Perform GET /health with builder options
    const response = await client.get('/health', builderOptions);

    // 3. Assert status and contract headers
    expect(response.status).toBe(200);
    const contentType = response.headers['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(response.data.status).toBe('ok');
  });
});
