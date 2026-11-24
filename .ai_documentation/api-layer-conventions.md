# API layer conventions

API tests live in `tests/eventhub/api/` and run on the dedicated Playwright **`api`** project (no browser).
The `chromium` project ignores that folder. Run one tag locally: `npx playwright test --project=api --grep @api_auth`.

## Structure (`src/eventhub/api/`)

| Path | Role |
| --- | --- |
| `api-client.ts` | `ApiClient`: wraps Playwright `APIRequestContext` (get/post/put/patch/delete), bearer token, typed `ApiResponse`, request/response logging. |
| `auth-api.ts`, `events-api.ts`, `bookings-api.ts`, `health-api.ts` | One class per endpoint group. Methods only call the client; **no assertions**. |
| `builders/` | Fluent payload/query builders (`AuthBuilder`, `EventBuilder`, `BookingBuilder`, `*FilterBuilder`). |
| `data/api-test-data.ts` | Data layer: static values and generators (`generateNewUser`, `generateUniqueEvent`). |
| `types.ts` | Request/response types. |

## Fixtures (`src/eventhub/api-fixtures.ts`)

API specs import `test`/`expect` from `src/eventhub/api-fixtures` (UI specs use `fixtures.ts`) and take services from fixtures; they do not
build or dispose an `ApiClient` themselves.

| Fixture | Gives |
| --- | --- |
| `api` | `{ client, authApi, eventsApi, bookingsApi, healthApi }`, unauthenticated. Use for register/login/health and negative auth tests. |
| `authedApi` | Same shape, already logged in as `USER` (status 200 and token asserted in the fixture). Use for events/bookings. |

```ts
test('creates an event', async ({ authedApi: { eventsApi } }) => { ... });
```

A new endpoint group = new `*Api` class + add it to `ApiServices` and `buildApiServices` in `api-fixtures.ts`.

Flow in a spec: data layer -> builder -> `*Api` method -> assertions in the spec (assertions stay in specs, as for UI).

## Rules

- **Paths have no required leading slash.** `ApiClient` forces the base URL to end in `/` and strips leading slashes from paths.
  A leading `/` in `new URL(path, baseURL)` would drop the `/api` segment and cause a 404.
- **Credentials**: every test except registration uses `apiTestData.auth.credentials`, which is `USER` from `config.ts`
  (`EVENTHUB_EMAIL` / `EVENTHUB_PASSWORD`, same account as the UI, no defaults). Registration uses `generateNewUser()`.
- **Login is asserted in the `authedApi` fixture** (status 200 and a token), so a bad login fails there and not as a later 401.
- **Prices are strings** in API responses (`"999"`, `"1998"`); compare with `Number(...)`.
- **Booking refs** are `<letter>-<6 alphanumerics>` with a varying prefix; match `/^[A-Z]-[A-Z0-9]{6}$/`.
- **Logging**: each call is printed to the console and attached to the test (so it appears in Allure). `password`, `token` and
  `authorization` values are masked as `***` by `redact()` in `api-client.ts`. Add any new secret field name to `SENSITIVE_KEYS`.
- API URL: `API_BASE_URL` in `config.ts` (`EVENTHUB_API_URL`, default `https://api.eventhub.rahulshettyacademy.com/api`) is the only place the default lives; `ApiClient` imports it.
- **No browser for API tests**: `api-fixtures.ts` extends plain `@playwright/test` and has no UI login, so API specs never launch a browser. Don't import `fixtures.ts` in API specs (its `storageState` logs in through the UI for every test).
- **Parallel workers**: CI runs with `workers: 1`. Locally, many workers creating events at once can make the backend return
  404 `Record not found` on `POST /events`; if that happens run the API project with `--workers=1`.
- Prefer unique data per test (`generateUniqueEvent`) since the backend is shared.

## Tags

| Tag | Spec |
| --- | --- |
| `@api_auth` | `api-auth.spec.ts` |
| `@api_events` | `api-events.spec.ts` |
| `@api_bookings` | `api-bookings.spec.ts` |
| `@api_health` | `api-health.spec.ts` |

All are in the CI matrix with `project: api` (see `github-actions-tags.md`).
