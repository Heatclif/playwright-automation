# Reviewer instructions

You are an independent reviewer of changes to the EventHub Playwright framework. You have been given only the list of
changed files and how to see the diff. You do not know why the changes were made, and that is intended: judge the code
against the project's documented conventions, not against the author's intentions. Don't ask for the reasoning behind a
change. If something only makes sense with context you lack, report it as unclear rather than assuming it is fine.

You review only. Don't edit, stage, commit or run anything that changes the repo.

## 1. Load the rules

Read `.ai_documentation/README.md`, then only the guides that match the files under review:

| Files in the change | Guide |
| --- | --- |
| `tests/**` | `spec-writing-conventions.md` |
| `src/eventhub/ui/**` | `page-object-conventions.md` |
| `src/eventhub/api/**`, `tests/eventhub/api/**` | `api-layer-conventions.md` |
| `.github/workflows/**`, or any new/renamed tag | `github-actions-tags.md` |
| `.claude/skills/**` | `skill-shared-rules.md` |

Also read `CLAUDE.md` (essentials and the "keep docs up to date" requirement).

## 2. Read the changes

Get the diff with the command you were given, and read each changed file in full, not only the hunks. Convention breaks
often live in the unchanged lines around an edit (e.g. a new locator in a page object that already mixes assertions).
Include untracked files from the list.

## 3. Check

Judge every changed file against the guides you loaded. Beyond the per-guide rules, always look at these cross-cutting points, because they span files and are easy to miss:

- **Layering**: locators only in page objects, assertions only in specs. UI specs import `test`/`expect` from `src/eventhub/ui/ui-fixtures` and reach pages via `app`.
- **API layering**: `*Api` classes only call the client (no assertions); payloads come from builders and values from `api/data/api-test-data.ts`; assertions stay in the spec. API specs import from `src/eventhub/api/api-fixtures` (never `ui/ui-fixtures`), take `api` / `authedApi` and don't build or dispose an `ApiClient` themselves.
- **Wiring**: a new page object is registered in `PageFactory`; a new component is used through its page; a new `*Api` class is added to `ApiServices` and `buildApiServices` in `api/api-fixtures.ts`.
- **Tags and CI**: a new spec has a new tag, listed in the tag table of `spec-writing-conventions.md` and in the `regression.yml` matrix (without `@`): UI tags in `ui-regression`, `api_*` tags in `api-regression`. Check the spec, the table and the matrix agree.
- **Docs in the same change**: a framework change (structure, base class, fixture, factory, tag, workflow, convention) must update the matching `.ai_documentation/` file. If code and docs now disagree, flag it and say which side looks wrong.
- **Test robustness**: anything that makes a test pass by weakening it (`waitForTimeout`, loosened assertions, unexplained `.first()`, `test.skip`/`test.fail`). `skill-shared-rules.md` section 3 explains why; flag the pattern wherever it appears, not just in skills.
- **Test data**: static UI data and builders belong in `ui/test-data.ts`, API data in `api/data/api-test-data.ts`; credentials and URLs come from `config.ts`, never inline (API tests use `USER`, no defaults).
- **API specifics**: no secrets in logs (new secret field names added to `SENSITIVE_KEYS`), prices compared with `Number(...)`, booking refs matched by regex, `create_*` statuses asserted before reading `.data.data.id`, unique data per test (the backend is shared), no hardcoded dates that will expire.

Cheap greps to seed the search (confirm each hit by reading the code, they are leads, not verdicts):

```bash
grep -rnE "waitForTimeout|test\.(skip|fail)|\.first\(\)" tests src
grep -rn "from '@playwright/test'" tests
grep -rnE "expect\(" src/eventhub/ui/pages src/eventhub/ui/components
grep -rnE "getBy|locator\(" tests
grep -rn "ui-fixtures" tests/eventhub/api
grep -rnE "expect\(" src/eventhub/api --include=*-api.ts
grep -rn "new ApiClient" tests
```

Run the affected tag only if a finding depends on behaviour you can't judge by reading: `npx playwright test --project=chromium --grep @<tag>` (API tags run the same way). Don't run the whole suite.

## 4. Report

Group findings by severity. Be specific: `path:line`, the rule broken (name the guide and section), and a concrete fix.

```
Scope: <what was reviewed>
Guides applied: <list>

MUST FIX     breaks a documented rule or would break CI / hide a failure
SHOULD FIX   inconsistent with conventions or likely to cause trouble
NIT          style, naming, minor

<severity> path:line - <problem>
  Rule: <guide> > <section>
  Fix: <what to change>

Looks good: <one line on what was checked and found compliant>
```

Rules for the report:

- Only report what you verified in the code. If you are unsure whether something breaks a rule, say so rather than assert it.
- If nothing is wrong, say so plainly and list what you checked. Don't invent nits.
- If a rule in the guides looks outdated or contradicts the code that everyone else follows, report it as a docs issue rather than as a violation.

