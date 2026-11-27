import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { AuthBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Log in with existing credentials', { tag: '@api' }, () => {
  test('POST--auth-login-1: POST /auth/login', async ({ api: { authApi } }) => {
    const { email, password } = apiTestData.auth.credentials;
    const payload = new AuthBuilder()
      .with_email(email)
      .with_password(password)
      .build();

    const response = await authApi.login_user(payload);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(typeof response.data.token).toBe('string');
    expect(response.data.token).toBeTruthy();
    expect(response.data.user?.email).toBe(email);
  });
});
