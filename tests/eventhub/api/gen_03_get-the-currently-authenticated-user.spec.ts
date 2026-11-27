import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Get the currently authenticated user', { tag: '@api' }, () => {
  test('GET--auth-me-2: GET /auth/me', async ({ authedApi: { authApi } }) => {
    const response = await authApi.get_me();

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(typeof response.data.user?.userId).toBe('number');
    expect(response.data.user?.email).toBe(apiTestData.auth.credentials.email);
  });
});
