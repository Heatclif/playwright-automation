# Playwright automation (EventHub)

Playwright Test + TypeScript, Page Object Model with a `PageFactory`, Allure reporting, GitHub Actions regression sharded by tag.

## Source of truth: `.ai_documentation/`

Before writing or changing code, read the relevant guide in `.ai_documentation/` and follow it:

- Adding/editing tests or tags: `.ai_documentation/spec-writing-conventions.md`
- Adding/editing page objects, components or the `PageFactory`: `.ai_documentation/page-object-conventions.md`
- Adding a tag that must run in CI: `.ai_documentation/github-actions-tags.md`
- Writing/editing a skill in `.claude/skills/`: `.ai_documentation/skill-shared-rules.md` (link to it, don't copy its rules)
- Overview and project map: `.ai_documentation/README.md`

## Keep the docs up to date (required)

Any change to the framework (folder structure, base classes, fixtures, factory pattern, tags, workflow files, conventions)
must update the matching file in `.ai_documentation/` **in the same change**. If code and docs disagree, fix whichever is wrong; never leave them diverging.

## Essentials

- Import `test`/`expect` from `src/eventhub/fixtures`, not `@playwright/test`; reach pages via the `app` fixture.
- No raw selectors or assertions in the wrong layer: locators in page objects, assertions in specs.
- New spec = new tag = add it to the `regression.yml` matrix (without `@`).
- Run a tag locally: `npx playwright test --project=chromium --grep @<tag>`.
