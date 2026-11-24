---
name: add-playwright-test
description: Turn a test scenario and/or Playwright codegen steps (UI), or an API endpoint scenario (HTTP request/response checks), into working tests in this EventHub Playwright framework (page objects and PageFactory, or API classes and builders; spec, tag, CI matrix), then run them and self-correct up to 2 times. Use this whenever the user gives a test scenario, a test case description, an API/endpoint test to cover, pasted `playwright codegen` output, or says things like "add a test for...", "automate this flow", "convert this codegen into a spec", "write a Playwright test for...", or "cover this scenario", even if they don't mention page objects or the skill by name.
---

# Add a Playwright test

Input is one or both of:

1. **Test scenario**: plain-language description of what to verify.
2. **Codegen steps**: raw `playwright codegen` output (selectors and actions, usually no assertions). UI only.

First decide the **layer**: a scenario about pages, clicks or what the user sees is a **UI test**; one about an HTTP endpoint, request payload, status code or response body is an **API test** (see "API tests" below). If unclear, ask in one line.

Output is working, convention-compliant code that has been run. The framework's rules live in `.ai_documentation/`. Read the guides; this skill only covers the workflow, so rules aren't duplicated here and can't drift.

## Step 0: Load the rules

Read `.ai_documentation/README.md`, then:

- `page-object-conventions.md` before touching `src/eventhub/`
- `spec-writing-conventions.md` before touching `tests/eventhub/` or choosing a tag
- `api-layer-conventions.md` before touching `src/eventhub/api/` or `tests/eventhub/api/` (API tests)
- `github-actions-tags.md` only if a new tag is needed

Then skim the existing code the change could touch: `src/eventhub/ui/pages/`, `ui/components/`, `ui/PageFactory.ts`, `ui/test-data.ts` and the `tests/eventhub/ui/*.spec.ts` names. For API tests skim `src/eventhub/api/` (the `*Api` classes, `builders/`, `data/api-test-data.ts`) and `tests/eventhub/api/*.spec.ts` instead. You need this to judge confidence and to reuse what exists.

## Step 1: Choose the path

Score your confidence using `references/confidence-rubric.md`. In short, you need **both inputs** and **80%+ confidence** on all of these:

- the UI elements are already covered by existing page objects/components, or the codegen selectors are enough to build new ones that follow the conventions
- you know which spec file the tests belong in, or that a new spec + tag is warranted
- you know whether new page objects are needed, and what they are named

| Situation | Path |
| --- | --- |
| Both inputs, confidence >= 80% | **Path A: write directly** |
| Anything else (one input missing, unfamiliar page, ambiguous placement, codegen selectors look brittle) | **Path B: explore with Playwright MCP** |

State the path and the one-line reason in your reply before starting, e.g. "Path A (92%): codegen only touches Events page, existing `EventsPage` covers it, belongs in `events.spec.ts`." The user can then redirect early if they disagree. If you are under 80% only because of a question the user could answer in one line (for example, which feature area?), ask it, rather than burning an MCP session.

## Path A: write directly

1. Map each codegen step to an existing page-object member, or to a new one (conventions doc, "Adding elements" and "Creating a new page object"). Replace codegen's raw selectors with the locator preference order from the doc; codegen often emits CSS/nth selectors that the doc ranks last.
2. Add missing locators/actions to the right page object or component. A new page also gets a `PageFactory` getter.
3. Add the spec. Placement follows the doc: same feature goes in the existing spec's describe, unrelated feature gets a new spec file and tag (and then `github-actions-tags.md` applies: add to `regression.yml` matrix and the tag table).
4. Codegen has no assertions. Derive them from the scenario's expected results. If the scenario states none, add the most obvious user-visible outcome and mention in the summary that you inferred it.
5. Data: credentials from `USER` in `config.ts`, reusable data/builders in `ui/test-data.ts`; never hardcode in specs.
6. Go to **Run and fix**.

## Path B: explore with Playwright MCP

Use this to fill gaps (missing codegen, unknown page, partial steps) or to build everything from a scenario alone. The `mcp__playwright__*` tools are the Playwright MCP server; if they aren't available, say so and ask the user for codegen output instead of guessing selectors.

1. Navigate to `BASE_URL` from `src/eventhub/config.ts`. Log in with `USER` if the flow needs a session.
2. Perform the scenario steps with `browser_snapshot` before each action. The accessibility snapshot gives you role/name/label information, which maps directly onto the preferred locators (`getByRole`, `getByLabel`...). Prefer it over screenshots.
3. For each step, note: the locator you'd write, the action, and what observable outcome confirms the step (URL, heading, toast, row appearing). These outcomes become the assertions.
4. Where codegen steps were supplied, replay them first and only explore the gaps.
5. Don't create or delete real data beyond what the scenario needs, and use unique names (`buildEvent()`-style builders) so runs stay independent.
6. Close the browser, then write the code exactly as in Path A steps 1-5, using what you observed.

## API tests

Use this instead of Path A/B when the layer is API. Codegen and Playwright MCP's browser don't apply, so there is no confidence score: if the endpoint's request or response shape is unknown, discover it first, otherwise write directly.

1. **Find what exists**: the endpoint may already have a method in a `*Api` class (`auth-api.ts`, `events-api.ts`, `bookings-api.ts`, `health-api.ts`), a builder and data in `api/data/api-test-data.ts`. Reuse them.
2. **Discover unknown shapes** by calling the endpoint once (for example `curl` against `API_BASE_URL` from `src/eventhub/config.ts`, with a token from `POST auth/login` using `EVENTHUB_EMAIL` / `EVENTHUB_PASSWORD` from `.env`). Never print the password or token in your reply. Don't create more data than the scenario needs, and use unique data (`generateUniqueEvent`-style). If the user supplied a curl command, payload or response sample, use it instead.
3. **Write in the layers from `api-layer-conventions.md`**: values in `api/data/api-test-data.ts`, payloads in a builder, a method in the `*Api` class (calls only, **no assertions**), types in `api/types.ts`. A new endpoint group is a new `*Api` class registered in `ApiServices` and `buildApiServices` in `api/api-fixtures.ts`.
4. **Spec**: in `tests/eventhub/api/`, importing `test`/`expect` from `src/eventhub/api/api-fixtures` (never `ui/ui-fixtures`). Take services from the `api` fixture (unauthenticated) or `authedApi` (logged in as `USER`); don't build an `ApiClient` in the spec. Assertions live in the spec: status first, then body. Prices are strings (`Number(...)`), booking refs match `/^[A-Z]-[A-Z0-9]{6}$/`.
5. **Tag and CI**: same feature goes under the existing `@api_*` describe; a new spec gets a new `api_` tag, added to the `api-regression` matrix in `regression.yml` and to the tag table in `spec-writing-conventions.md`.
6. Go to **Run and fix**. The run command is the same, for example `npx playwright test --project=chromium --grep @api_events`. API specs launch no browser.

## Run and fix

Running the new tests is a required step, not optional: never finish or report "done" on code that hasn't been executed, because an unrun test is only a guess. Run it from the repo root.

1. Run the new test(s) first, narrowly, so feedback is fast:

   ```bash
   npx playwright test --project=chromium <spec-path> -g "<new test title>"
   ```

2. When you added to an existing spec, or touched a shared component/`BasePage`/`PageFactory`, also run the whole tag (command from the docs) to confirm you didn't break neighbours:

   ```bash
   npx playwright test --project=chromium --grep @<tag>
   ```

3. Confirm from the output that the new test(s) were actually selected and executed (not "No tests found", not skipped). The run is only green if every selected test passed.

On failure, classify it using `references/failure-triage.md` before doing anything:

- **Environmental or data problem** (wrong credentials, account locked, user/data doesn't exist, site down, missing `.env`): **stop immediately, no retries.** Retrying can't fix it and may lock the account. Report what you saw and what the user must supply.
- **Code problem** (bad locator, strict-mode violation, wrong assertion, missing wait that auto-waiting should cover, missing factory registration, TypeScript error): fix and re-run. **Maximum 2 fix attempts**, so 3 runs in total. Each attempt must be based on evidence (the error, and a fresh `browser_snapshot` if the locator is suspect), not a guess. Don't loosen an assertion just to get green; if the assertion contradicts the app's behaviour, that's a finding for the user (`.ai_documentation/skill-shared-rules.md`, section 3).

For API tests, each call is logged in the output and attached to the test (secrets masked), so read the logged status and response body as your evidence instead of a `browser_snapshot`.

Never "fix" by weakening the test: follow `.ai_documentation/skill-shared-rules.md`, section 3.

## Hand-off

If still failing after 2 fixes, or if it's an environmental problem, stop and hand control to the user. Include: what's failing, the error line, what you tried, and your best hypothesis. Leave the code in place (it's reviewable) and say it is not green.

## Final report

Keep it short:

- Layer (UI or API), path taken and confidence (UI)
- Files created/modified (page objects and factory, or API class, builder, data and fixtures; spec, workflow matrix, docs)
- Run result: pass, or what failed and why
- Anything you inferred (assertions, tag name, placement) that the user should double-check

## Keeping docs in sync

If the change introduces a new tag, folder, or pattern, update the matching `.ai_documentation/` file in the same change (the project's CLAUDE.md requires it). Do not commit unless asked (shared rules, section 4).
