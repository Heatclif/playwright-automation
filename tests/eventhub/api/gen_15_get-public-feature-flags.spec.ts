import { test, expect } from '../../../src/eventhub/api/api-fixtures';

test.describe('Get public feature flags', { tag: '@api' }, () => {
  test('GET--config-14: GET /config', async ({ api: { healthApi } }) => {
    const response = await healthApi.get_config();

    expect(response.status).toBe(200);
    expect(typeof response.data.showExploreLinks).toBe('boolean');
  });
});
