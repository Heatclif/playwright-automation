import { test as base, expect } from '@playwright/test';
import { USER } from './config';
import { ApiClient } from './api/api-client';
import { AuthApi } from './api/auth-api';
import { EventsApi } from './api/events-api';
import { BookingsApi } from './api/bookings-api';
import { HealthApi } from './api/health-api';
import { AuthBuilder } from './api/builders/auth-builder';

/** Everything an API test needs: the client plus one class per endpoint group. */
export type ApiServices = {
  client: ApiClient;
  authApi: AuthApi;
  eventsApi: EventsApi;
  bookingsApi: BookingsApi;
  healthApi: HealthApi;
};

type ApiFixtures = {
  /** Unauthenticated API services (disposed after the test). */
  api: ApiServices;
  /** API services already logged in as USER (login is asserted). */
  authedApi: ApiServices;
};

/**
 * Fixtures for API specs only. No browser, no UI login.
 * UI specs use `fixtures.ts` instead.
 */
export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    await use(buildApiServices(client));
    await client.dispose();
  },

  authedApi: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    const services = buildApiServices(client);
    const payload = new AuthBuilder().with_email(USER.email).with_password(USER.password).build();
    const res = await services.authApi.login_user(payload);
    expect(res.status, 'API login').toBe(200);
    expect(res.data.token, 'API login token').toBeTruthy();
    client.set_auth_token(res.data.token!);
    await use(services);
    await client.dispose();
  },
});

function buildApiServices(client: ApiClient): ApiServices {
  return {
    client,
    authApi: new AuthApi(client),
    eventsApi: new EventsApi(client),
    bookingsApi: new BookingsApi(client),
    healthApi: new HealthApi(client),
  };
}

export { expect };
