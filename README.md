# Playwright Automation (EventHub)

Playwright Test + TypeScript, Page Object Model with a `PageFactory`, Allure reporting, and GitHub Actions regression sharded by tag. Targets the [EventHub](https://eventhub.rahulshettyacademy.com) sandbox application.

> **Note:** This repository is the base Playwright framework for the QE AI Excellence Program 2026 — Capstone Project 2 (AI-Accelerated UI & API Automation), Team B. It is intentionally minimal: conventions and contribution rules live in `.ai_documentation/` and are enforced by `CLAUDE.md`.

---

## Table of Contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & setup](#installation--setup)
- [Project structure](#project-structure)
- [Writing tests (conventions)](#writing-tests-conventions)
- [Page Object Model conventions](#page-object-model-conventions)
- [Tags & CI sharding](#tags--ci-sharding)
- [Running tests locally](#running-tests-locally)
- [CI/CD pipeline](#ci-cd-pipeline)
- [Allure reporting](#allure-reporting)
- [Credentials & security](#credentials--security)
- [Keeping docs in sync](#keeping-docs-in-sync)
- [License](#license)

---

## Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | `^22.12.0` | Runtime |
| TypeScript | `6.0.3` | Language / typechecking |
| Playwright Test | `1.64.1` | Test runner (UI + API) |
| Playwright browsers | Chromium, Firefox | Browser automation |
| ESLint | `10.13.0` | Linting |
| zod | `4.6.7` | Schema validation (API responses) |
| Allure Playwright | `3.14.0` | Test reporting |
| Allure Commandline | `2.46.1` | Report generation |
| dotenv | `18.0.7` | Local env loading |

---

## Prerequisites

- Node.js `^22.12.0` (see `package.json` `engines`)
- A valid EventHub demo account (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`)
- Docker (optional, only if you run a local copy of the SUT instead of the public sandbox)

---

## Installation & setup

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

Copy the example file and fill in your EventHub credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
EVENTHUB_EMAIL=your-eventhub-email
EVENTHUB_PASSWORD=your-eventhub-password
# Optional override of the target base URL
# EVENTHUB_BASE_URL=https://eventhub.rahulshettyacademy.com
```

> **Security:** `.env` is gitignored and must never be committed. In CI, credentials are supplied as GitHub repository secrets (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`).

### 3. Install Playwright browsers

```bash
npx playwright install chromium
```

### 4. Verify the setup

Typecheck:

```bash
npx tsc --noEmit
```

Lint:

```bash
npx eslint .
```

Run the existing authentication specs against the EventHub sandbox:

```bash
npx playwright test --project=chromium --grep @auth
```

A green run confirms the foundation is working.

---

## Project structure

```
playwright-automation/
├── .ai_documentation/        # Source of truth for conventions (README, spec, page-object, CI-tag, skill rules)
├── .claude/                  # Claude Code skills (e.g. failure-analysis for Allure)
├── .github/
│   └── workflows/
│       ├── regression.yml            # CI entry point; matrix shards by tag
│       ├── helper-playwright-common.yml
│       ├── helper-post-gh-page.yml
│       └── helper-claude-analysis.yml
├── mcp/
│   └── allure-report/              # Allure MCP server for Claude failure analysis
├── src/
│   └── eventhub/
│       ├── config.ts               # BASE_URL, USER (from env / secrets)
│       ├── types.ts                # Shared TypeScript interfaces
│       ├── test-data.ts            # Static data + builders (CUSTOMER, buildEvent, futureDateTime)
│       ├── fixtures.ts             # Custom test fixture (login-once storageState, `app` PageFactory)
│       ├── PageFactory.ts          # Lazy cached page objects, exposed via `app.<page>`
│       ├── components/             # Reusable UI pieces (Form, NavBar, ConfirmDialog)
│       └── pages/                  # One class per page, extends BasePage
├── tests/
│   ├── eventhub/                   # Feature specs (auth, events, booking, admin-events, failing-demo)
│   └── practice/                   # Practice / exercise specs
├── playwright.config.ts            # Playwright Test config (projects, reporters, timeouts)
├── .env.example                    # Credentials template (copy to .env, never commit .env)
├── .mcp.json                       # Allure MCP configuration
├── CLAUDE.md                       # Agent guidance (source of truth for AI/human contributors)
├── package.json
├── tsconfig.json
└── README.md                       # This file
```

---

## Writing tests (conventions)

Full rules: `.ai_documentation/spec-writing-conventions.md`. Summary:

- Import `test` and `expect` from the custom fixtures, **never** from `@playwright/test` directly:

  ```ts
  import { expect, test } from '../../src/eventhub/fixtures';
  ```

- Reach page objects through the `app` fixture (`PageFactory`): `app.loginPage`, `app.eventsPage`, etc.
- Specs **never** construct page objects with `new` and never write raw selectors. Locators live in page objects.
- Every test is logged in by default (login once per worker via `storageState`). For logged-out scenarios:

  ```ts
  test.use({ storageState: { cookies: [], origins: [] } });
  ```

- Credentials come from `USER` in `src/eventhub/config.ts`; reusable data/builders come from `src/eventhub/test-data.ts`. Never hardcode credentials or data in specs.
- **One spec file per feature area**, kebab-case, under `tests/eventhub/` (e.g. `auth.spec.ts`, `booking.spec.ts`).
- **Exactly one top-level `test.describe` per file**, named after the feature, with exactly one tag:

  ```ts
  test.describe('Authentication', { tag: '@auth' }, () => {
    test.beforeEach(async ({ app }) => {
      await app.loginPage.goto();
    });

    test('user can log in with valid credentials', async ({ app, page }) => {
      await app.loginPage.login(USER.email, USER.password);
      await expect(page).toHaveURL('/');
    });
  });
  ```

- Assert with web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout`.
- Keep assertions in the spec; page objects expose locators and actions, not `expect` calls.
- Tests must be independent and parallel-safe: create unique data with builders (`buildEvent()`) rather than fixed names; clean up data a test creates when the app allows it.

---

## Page Object Model conventions

Full rules: `.ai_documentation/page-object-conventions.md`. Summary:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Page object | `src/eventhub/pages/<Name>Page.ts` | Locators and actions for one page; extends `BasePage` |
| Component | `src/eventhub/components/<Name>.ts` | Reusable UI piece (Form, NavBar, ConfirmDialog) |
| Factory | `src/eventhub/PageFactory.ts` | One lazily created, cached instance of each page per `page` |
| Types | `src/eventhub/types.ts` | Shared interfaces / unions |
| Test data | `src/eventhub/test-data.ts` | Static data and builders |
| Config | `src/eventhub/config.ts` | `BASE_URL`, `USER` |

### Adding a new page object

1. Create `src/eventhub/pages/<Name>Page.ts`, class `<Name>Page extends BasePage` (PascalCase, ends in `Page`).
2. Set `readonly path = '/route';` and declare locators/components in the constructor after `super(page)`.
3. Add actions as `async` methods (one user-level thing each).
4. **Register it in `PageFactory.ts`**: import the class, add a camelCase getter:

   ```ts
   get checkoutPage() { return this.get(CheckoutPage); }
   ```

5. Use it in specs as `app.checkoutPage`. One page = one getter; never instantiate a page elsewhere.
6. Add shared types to `types.ts` and data/builders to `test-data.ts`.
7. Update `.ai_documentation/page-object-conventions.md` if you introduce a new pattern.

### Locator preference order

`getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId` → CSS/ID (last resort).

- Use `getByTestId('...')` where the app provides stable test IDs.
- Dynamic elements are **methods that return a `Locator`**, not properties.
- No hard waits, no `page.waitForTimeout`, no fabricated IDs/labels, no positional XPath/CSS, no forced clicks.
- **No assertions in page objects.** Return locators; the spec asserts.

---

## Tags & CI sharding

Full rules: `.ai_documentation/github-actions-tags.md`.

- Every spec has exactly one feature tag on the top-level describe: `test.describe('X', { tag: '@x' }, ...)`.
- Tag format: `@` + lower snake_case, matching the feature/spec name.
- CI (`regression.yml`) shards the suite **by tag**: each tag in the matrix runs `--grep "@<tag>"` as its own job.
- To add a tag that runs in CI:
  1. Tag the spec (`test.describe('Name', { tag: '@my_tag' }, ...)`).
  2. Add `my_tag` (without `@`) to the `matrix.tag` list in `.github/workflows/regression.yml`.
  3. Add the tag to the "Current tags" table in `.ai_documentation/spec-writing-conventions.md`.
  4. Check locally: `npx playwright test --project=chromium --grep @my_tag`.

Current tags (from `spec-writing-conventions.md`):

| Tag | Spec | In CI matrix |
|-----|------|--------------|
| `@auth` | `auth.spec.ts` | yes |
| `@events` | `events.spec.ts` | yes |
| `@booking` | `booking.spec.ts` | yes |
| `@admin_event` | `admin-events.spec.ts` | yes |
| `@failing_demo` | `failing-demo.spec.ts` | yes (intentionally failing) |

> `failing-demo.spec.ts` exists to demonstrate failures/flakiness in reports. Do not copy its pattern into real feature specs, and do not "fix" these tests.

---

## Running tests locally

Run a single tag (recommended during development):

```bash
npx playwright test --project=chromium --grep @auth
```

Run all eventhub specs:

```bash
npx playwright test tests/eventhub
```

Run everything except the intentionally-failing demo:

```bash
npx playwright test --grep-invert @failing_demo
```

List all discovered tests:

```bash
npx playwright test --list
```

View the last HTML report:

```bash
npx playwright show-report
```

---

## CI/CD pipeline

`.github/workflows/regression.yml` is the entry point. On schedule (03:30 UTC Mon–Fri = 09:00 IST) or `workflow_dispatch`:

1. **regression** job — matrix shards by tag; each tag job runs `helper-playwright-common.yml` (checkout, Node, `npm ci`, browser install, run `--grep "@<tag>"`, upload `allure-results_<tag>`).
2. **combine-report** job — merges all `allure-results_*`, restores history from gh-pages, generates combined Allure report, publishes to gh-pages (`helper-post-gh-page.yml`).
3. **claude-analysis** job — optional, manual-run only; runs Claude failure analysis against the combined Allure report (`helper-claude-analysis.yml`, requires `ANTHROPIC_API_KEY` secret).

Credentials (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`) are passed as repo secrets; never stored in the repo.

---

## Allure reporting

The Playwright config uses the Allure reporter. Per-tag CI jobs upload `allure-results_<tag>` artifacts; the `combine-report` job produces a combined report with history and publishes it to GitHub Pages.

Locally, after a run:

```bash
npx playwright show-report
```

The `mcp/allure-report` directory exposes an Allure MCP server used by the Claude failure-analysis skill in CI.

---

## Credentials & security

- `src/eventhub/config.ts` requires `EVENTHUB_EMAIL` and `EVENTHUB_PASSWORD`; it throws if missing.
- Locally: set them in `.env` (copy `.env.example`; `.env` is gitignored).
- In CI: set them as GitHub repository secrets; `regression.yml` passes them to the test jobs.
- Never commit `.env`, credentials, or `test-results/` from runs against a non-local deployment (traces/screenshots can contain typed credentials).

---

## Keeping docs in sync

Per `CLAUDE.md`, `.ai_documentation/` is the **source of truth**. Any change to the framework (folder structure, base classes, fixtures, factory pattern, tags, workflow files, conventions) must update the matching file in `.ai_documentation/` **in the same change**. If code and docs disagree, fix whichever is wrong; never leave them diverging.

Files to keep in sync:
- New/renamed folder, base class, fixture, or factory → update the relevant guide in `.ai_documentation/`
- New tag → update the tag table in `spec-writing-conventions.md` and follow `github-actions-tags.md`
- Workflow file renamed or restructured → update `github-actions-tags.md`

---

## License

ISC
