// tests/eventhub/api/api-auth.spec.ts
import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { AuthBuilder } from '../../../src/eventhub/api/builders/auth-builder';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Auth API @api_auth', () => {

  test('registers a new user successfully', async ({ api: { authApi } }) => {
    // 1. Obtain test values from data layer
    const newUserData = apiTestData.auth.generateNewUser();

    // 2. Pass data layer values into builder methods to construct final payload
    const payload = new AuthBuilder()
      .with_email(newUserData.email)
      .with_password(newUserData.password)
      .build();

    // 3. Execute API call via AuthApi helper
    const response = await authApi.register_user(payload);

    // 4. Validate response assertions
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(typeof response.data.token).toBe('string');
    expect(response.data.token!.length).toBeGreaterThan(0);
    expect(response.data.user?.email).toBe(newUserData.email);
  });

  test('logs in with valid credentials', async ({ api: { authApi } }) => {
    // 1. Obtain test values from data layer
    const validUser = apiTestData.auth.credentials;

    // 2. Pass values into builder
    const payload = new AuthBuilder()
      .with_email(validUser.email)
      .with_password(validUser.password)
      .build();

    // 3. Execute login
    const response = await authApi.login_user(payload);

    // 4. Assert response
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(typeof response.data.token).toBe('string');
    expect(response.data.token!.length).toBeGreaterThan(0);
    expect(response.data.user?.email).toBe(validUser.email);
  });

  test('returns user identity on GET /auth/me for valid token', async ({ api: { client, authApi } }) => {
    // 1. Log in to acquire a valid token
    const validUser = apiTestData.auth.credentials;
    const loginPayload = new AuthBuilder()
      .with_email(validUser.email)
      .with_password(validUser.password)
      .build();

    const loginResponse = await authApi.login_user(loginPayload);
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.data.token!;

    // 2. Configure client with auth token
    client.set_auth_token(token);

    // 3. Request current user profile
    const meResponse = await authApi.get_me();

    // 4. Assert response identity
    expect(meResponse.status).toBe(200);
    expect(meResponse.data.success).toBe(true);
    expect(meResponse.data.user?.email).toBe(validUser.email);
    expect(typeof meResponse.data.user?.userId).toBe('number');
  });

  test('rejects login with wrong password', async ({ api: { authApi } }) => {
    // 1. Obtain values from data layer
    const email = apiTestData.auth.credentials.email;
    const wrongPassword = apiTestData.auth.wrongPassword;

    // 2. Pass into builder
    const payload = new AuthBuilder()
      .with_email(email)
      .with_password(wrongPassword)
      .build();

    // 3. Execute login
    const response = await authApi.login_user(payload);

    // 4. Assert validation failure
    expect([400, 401]).toContain(response.status);
    expect(response.data.success).toBe(false);
    expect(response.data.error).toBeDefined();
  });

  test('rejects registration with password shorter than 6 characters', async ({ api: { authApi } }) => {
    // 1. Obtain values from data layer (boundary: 3 chars < 6 chars min)
    const shortUserData = apiTestData.auth.shortPasswordUser;

    // 2. Pass values into builder
    const payload = new AuthBuilder()
      .with_email(shortUserData.email)
      .with_password(shortUserData.password)
      .build();

    // 3. Execute registration
    const response = await authApi.register_user(payload);

    // 4. Assert rejection
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
    expect(response.data.details).toBeDefined();
    const passwordError = response.data.details?.some(
      (detail) => detail.field === 'password'
    );
    expect(passwordError).toBe(true);
  });

  test('rejects GET /auth/me when request lacks Authorization header', async ({ api: { client, authApi } }) => {
    // Explicitly unauthenticated client
    client.set_auth_token(null);

    const response = await authApi.get_me();

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
  });
});
