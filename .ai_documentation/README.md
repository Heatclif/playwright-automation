# AI documentation (source of truth)

Guidelines and patterns for AI assistants (and humans) working on this framework.
**These files are the source of truth.** When they disagree with your assumptions, follow them.

| File | Read it when you are... |
| --- | --- |
| [spec-writing-conventions.md](spec-writing-conventions.md) | adding or changing a test / spec file, or choosing tags |
| [page-object-conventions.md](page-object-conventions.md) | adding elements, components or pages under `src/eventhub/` |
| [api-layer-conventions.md](api-layer-conventions.md) | adding or changing API tests, builders, API classes or `ApiClient` |
| [github-actions-tags.md](github-actions-tags.md) | introducing a new tag that must run in CI |
| [skill-shared-rules.md](skill-shared-rules.md) | writing or running a skill in `.claude/skills/` (Allure data handling, stop-on-error, never weaken tests, no commits) |

## Keeping this folder up to date

Any change to the framework **must update the matching file in the same change**:

- New/renamed folder, base class, fixture or factory pattern -> update the relevant guide.
- New tag -> update the tag table in `spec-writing-conventions.md` and follow `github-actions-tags.md`.
- Workflow file renamed or restructured -> update `github-actions-tags.md`.
- If a rule here stops being true, fix the rule (or the code) immediately. Never leave them diverging.

## Project map

```
src/eventhub/
  config.ts          BASE_URL, API_BASE_URL (env-overridable), USER (required from .env / GitHub secrets)
  ui/                UI layer (mirrors api/)
    ui-fixtures.ts   custom `test` for UI specs: baseURL, login-once storageState, `app` (PageFactory)
    types.ts         shared TypeScript types / interfaces
    test-data.ts     static data and builders (buildEvent, CUSTOMER, ...)
    PageFactory.ts   one lazily created instance of every page object
    components/      reusable UI pieces (Form, NavBar, ConfirmDialog)
    pages/           one class per page, extending BasePage
  api/               api-fixtures.ts (custom `test` for API specs: `api` / `authedApi`, no browser), ApiClient, per-endpoint API classes, builders, data layer (see api-layer-conventions.md)
tests/eventhub/      specs (one file per feature area); tests/eventhub/api/ runs on the `api` project
.github/workflows/   regression.yml (matrix) + helper-*.yml (reusable)
```
