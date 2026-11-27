import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { AuthBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Register a new user', { tag: '@api' }, () => {
  test('POST--auth-register-0: POST /auth/register', async ({ api: { authApi } }) => {
    const newUser = apiTestData.auth.generateNewUser('genreg');
    const payload = new AuthBuilder()
      .with_email(newUser.email)
      .with_password(newUser.password)
      .with_name(newUser.name)
      .build();

    const response = await authApi.register_user(payload);

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(typeof response.data.token).toBe('string');
    expect(response.data.token).toBeTruthy();
    expect(response.data.user?.email).toBe(newUser.email);
  });
});
