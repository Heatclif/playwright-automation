# Spec writing conventions

## Imports and fixtures

Always import `test` and `expect` from the custom fixtures, never from `@playwright/test`:

```ts
import { expect, test } from '../../src/eventhub/fixtures';
```

- Use the `app` fixture (the `PageFactory`) to reach page objects: `app.loginPage`, `app.eventsPage`, ...
- Specs never construct page objects with `new` and never write raw selectors. Locators live in page objects.
- Sessions: every test is logged in by default (login once per worker via `storageState`).
  For logged-out scenarios add `test.use({ storageState: { cookies: [], origins: [] } });` inside the describe.
- Credentials come from `USER` in `src/eventhub/config.ts`; reusable data and builders come from
  `src/eventhub/test-data.ts`. Never hardcode them in specs.

## How tests are arranged

1. **One spec file per feature area**, named `<feature>.spec.ts` in kebab-case under `tests/eventhub/`
   (`auth.spec.ts`, `admin-events.spec.ts`).
2. **Related scenarios go in the same spec.** If a test exercises the same feature/page/flow as an existing spec,
   add it to that file inside its `test.describe`.
3. **Unrelated scenarios get a new spec file** with its own `test.describe` and its own tag.
   Do not append a test to an unrelated spec just because it is convenient.
4. Exactly **one top-level `test.describe` per file**, named after the feature (`'Authentication'`, `'Bookings'`).
   Optional nested describes may group sub-flows, but the tag stays on the top-level one.
5. Shared setup goes in `test.beforeEach` inside the describe (e.g. `await app.loginPage.goto()`).
6. Tests must be **independent and parallel safe**: no ordering dependencies, and create unique data with
   builders (`buildEvent()`) rather than fixed names. Clean up data a test creates when the app allows it.
7. Test titles describe behaviour in plain language: `'user can log in with valid credentials'`,
   `'shows an error for a wrong password'`.
8. Assert with web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout`.
9. Keep assertions in the spec; page objects expose locators and actions, not `expect` calls.

Skeleton:

```ts
import { expect, test } from '../../src/eventhub/fixtures';

test.describe('Feature name', { tag: '@feature_name' }, () => {
  test.beforeEach(async ({ app }) => {
    await app.eventsPage.goto();
  });

  test('does something observable', async ({ app }) => {
    await expect(app.eventsPage.heading).toBeVisible();
  });
});
```

## Tags

### Rules

- Every spec has **exactly one feature tag**, set on the top-level describe: `test.describe('X', { tag: '@x' }, ...)`.
- Tag format: `@` + **lower snake_case**, matching the feature/spec name (`admin-events.spec.ts` -> `@admin_event`).
- The tag is the unit CI shards on: the workflow runs `--grep "@<tag>"` once per tag.
  Related tests therefore share a tag; unrelated specs must not share one.
- Do not tag individual tests with a feature tag; tag the describe.
- Playwright tags work with `--grep` / `--grep-invert`, e.g. `npx playwright test --grep @auth`.

### Current tags

| Tag | Spec | In CI matrix |
| --- | --- | --- |
| `@auth` | `auth.spec.ts` | yes |
| `@events` | `events.spec.ts` | yes |
| `@booking` | `booking.spec.ts` | yes |
| `@admin_event` | `admin-events.spec.ts` | yes |
| `@failing_demo` | `failing-demo.spec.ts` | yes (intentionally failing, see below) |

Keep this table in sync with the matrix in `.github/workflows/regression.yml`.

### Other kinds of tags

Only add a cross-cutting tag (e.g. `@smoke`) when there is a concrete need to select tests across features.
If you do, add it as an extra tag in the describe or on a single test (`{ tag: ['@x', '@smoke'] }`),
document it in the table above, and note it is not a CI shard tag unless added per `github-actions-tags.md`.

## Special case: intentionally failing tests

`failing-demo.spec.ts` exists to show how failures and flakiness appear in reports. It sets
`test.describe.configure({ retries: 0 })` so the CI-wide `retries: 2` does not hide the failures.
Do not copy this pattern into real feature specs; do not "fix" these tests.

`failing-demo.spec.ts` also holds several simple non-UI flaky tests (`flaky: ... (50% chance)`) that each pass about
half the time via a random `expect`, with an `INTENTIONAL FLAKY TEST` message on failure. Keep them there only;
do not add flaky tests to real feature specs.
