# AI documentation (source of truth)

Guidelines and patterns for AI assistants (and humans) working on this framework.
**These files are the source of truth.** When they disagree with your assumptions, follow them.

| File | Read it when you are... |
| --- | --- |
| [spec-writing-conventions.md](spec-writing-conventions.md) | adding or changing a test / spec file, or choosing tags |
| [page-object-conventions.md](page-object-conventions.md) | adding elements, components or pages under `src/eventhub/` |
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
  config.ts          BASE_URL (env-overridable), USER (required from .env / GitHub secrets)
  types.ts           shared TypeScript types / interfaces
  test-data.ts       static data and builders (buildEvent, CUSTOMER, ...)
  fixtures.ts        custom `test`: baseURL, login-once storageState, `app` (PageFactory)
  PageFactory.ts     one lazily created instance of every page object
  components/        reusable UI pieces (Form, NavBar, ConfirmDialog)
  pages/             one class per page, extending BasePage
tests/eventhub/      specs (one file per feature area)
.github/workflows/   regression.yml (matrix) + helper-*.yml (reusable)
```
