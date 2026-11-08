# Failure triage

Decide first whether a failure is something the code can fix. Only code failures get retries (max 2 fix attempts).

## Do not retry: hand back to the user

| Symptom | Likely cause | What to tell the user |
| --- | --- | --- |
| "Invalid email or password" during login or the worker `storageState` setup fails at `loginPage.login` / `nav.userEmail` expectation | Wrong or expired credentials in `config.ts` / `.env` | Set `EVENTHUB_EMAIL` / `EVENTHUB_PASSWORD` |
| Account locked / rate-limited / 429 / captcha | Too many attempts | Wait or use another account; do not retry |
| Scenario needs data that doesn't exist (an event, booking, user) and the app has no way for the test to create it | Missing seed data | Say exactly what data is needed |
| `net::ERR_*`, DNS failure, timeouts on `goto`, 5xx | Site or network down | Report; try again later |
| `Executable doesn't exist` / browsers not installed | Environment | `npx playwright install` |
| 403 / "not authorized" for the scenario's role | `USER` lacks the permission | Say which role is needed |

A quick way to tell: if the *same* failure would occur no matter how the test code is written, it's environmental.

## Retry: fix the code

| Symptom | Typical fix |
| --- | --- |
| `strict mode violation: ... resolved to N elements` | Make the locator more specific (scope under a component root, add `name`/`exact`). Understand why there are N before reaching for `.first()`. |
| `waiting for locator(...)` timeout, element not found | Re-snapshot the page with Playwright MCP; the role/name/label is probably different from what you assumed. Check you're on the right page/state. |
| `toHaveText`/`toHaveURL` mismatch | Compare with the app's actual output via snapshot. Fix the expectation only if the *expectation* was wrong (e.g. whitespace, regex), not to hide an app bug. |
| TypeScript error / `app.xPage is not a function` | Missing import, missing `PageFactory` getter, or getter name isn't camelCase of the class. |
| Test passes alone, fails with others | Shared/fixed test data; switch to unique data via builders; clean up. |
| "No tests found" for the tag | Tag typo, or the tag isn't set on the top-level describe. |

## Evidence rule

Each retry needs a reason you can state in one sentence that came from the error output or a fresh snapshot. If you can't
state one, you're guessing; stop and hand back instead of using up the attempts.

## Product bugs

If the app genuinely behaves differently from the scenario's expected result (and your locators are right), the test is
correct and the app is wrong. Don't change the assertion to match. Report it as a probable defect and, if the user
wants it kept, suggest `test.fail()` with a comment, but let them decide.
