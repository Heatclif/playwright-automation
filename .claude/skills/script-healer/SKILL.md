---
name: script-healer
description: Heal failing Playwright scripts. Either fix the NEW failures found via the allure-report MCP (with failure trend), or fix the specific tests the user names (spec files, test titles, tags or Allure uids). Each target is reproduced by running the test and, if needed, driving the app with Playwright MCP; the cause is fixed when fixable, otherwise the user is told why. Use whenever the user asks to fix, heal, investigate, debug or triage failing tests or scripts, new or latest failures from the Allure report / last CI run, or gives test names/spec files that are failing, even if they don't name the skill.
---

# Script healer

Pipeline: Allure MCP (what failed, trend) -> extractor script (compact view) -> reproduce -> classify -> fix or report.

## Modes (pick from the request)

| Mode | Trigger | Targets |
| --- | --- | --- |
| **New failures** (default) | "fix new failures", "what broke in the last run", no specific tests named | Failures that are new: failing now, no failure in the last 5 runs |
| **Named scripts** | The user gives identifiers: spec file names/paths, test titles (or fragments), tags, or Allure uids, one or many | Exactly the tests those identifiers match, **whatever their trend**. Naming a recurring or flaky test is an explicit request to fix it |

In default mode recurring and flaky failures are shown in the trend but not touched: they are known and often deliberate (e.g. `failing-demo.spec.ts`, `flaky-demo.spec.ts` are demos), so report them and move on unless the user asks. The two modes are not combined: if the user names tests, use Named scripts mode only; new failures are listed in the trend but not targeted. To also heal the new failures, the user asks separately.

Everything below (steps 4 to 6) is identical for both modes; only the target list differs.

## Hard rules

Follow `.ai_documentation/skill-shared-rules.md`: section 1 (don't read raw Allure JSON), 2 (stop and report on infrastructure failure), 3 (never make a test green by weakening it) and 4 (no commits or pushes). Read it before starting. In this skill, shared rule 1 means: use only the extractor script's output.

## Step 0: Load the rules

Read `.ai_documentation/README.md`, then `page-object-conventions.md` and/or `spec-writing-conventions.md` before editing anything under `src/eventhub/` or `tests/eventhub/`. Also read `.claude/skills/add-playwright-test/references/failure-triage.md`: its "do not retry" and "retry: fix the code" tables are the classification rubric used below.

## Step 1: Refresh the report (personal computer only)

Skip when `GITHUB_ACTIONS` is `true` or the user named their own report folder. Otherwise:

```bash
node .claude/skills/failure-analysis/scripts/sync-gh-pages.mjs
```

Non-zero exit: stop per shared rule 2. Note the `gh_pages_commit` it prints.

## Step 2: Query Allure for failures

Call `mcp__allure-report__list_failed_tests` (pass `reportPath` only if the user named a folder). The reply is small: a summary and an `outputFile` path. If `outputFile` is missing, stop per shared rule 2.

## Step 3: Extract trend and targets

```bash
# new failures mode
node .claude/skills/script-healer/scripts/extract-failures.mjs <outputFile>
# named scripts mode: comma-separated identifiers, exactly as the user gave them (a comma inside a test title would split it: use a fragment without the comma)
node .claude/skills/script-healer/scripts/extract-failures.mjs <outputFile> --ids=<id1,id2,...>
```

Prints counts, the trend of every failing test (`NEW` / `Recurring Failure` / `Flaky` with `failures/runs` over the last 5 runs), and file, test name, tag, trend and failure reason for each target. Show the user the trend section (it's short). Matching is a case-insensitive substring of spec file, test name, full name, tag or uid.

- **New failures mode, none found**: say so, list the recurring/flaky ones by name, and stop.
- **Named mode, `UNMATCHED` identifiers**: the report has no failing test for them (it may pass in Allure, the report may be stale, or the identifier is wrong). Resolve each against the repo (`ls tests/eventhub`, `grep -rn` the title or tag). If it maps to a real test, still reproduce it locally in step 4 using the user's description as the symptom, noting there was no Allure failure reason. If it maps to nothing, ask the user.
- **Named mode, an identifier matching several tests** (e.g. a whole spec or tag): all of them are targets.

The `file` value is the Allure suite label (e.g. `eventhub/foo.spec.ts`); the real path is `tests/<that>`. Confirm with `ls`.

## Step 4: Per target, reproduce and diagnose

Work through the targets one at a time. Start from the failure reason Allure gave (or the user's description if there is none), then:

1. **Reproduce locally** with the tag from the extractor output:
   ```bash
   npx playwright test --project=chromium <spec-path> -g "<test name>"
   ```
   - **Passes locally**: likely flaky or CI-environment-specific. Run it up to 3 times (`--repeat-each=3`) to see. If it passes every time, report "not reproducible locally" with the Allure reason and stop on this test; don't change code.
   - **Fails the same way**: continue.
   - **Fails differently**: note both errors; diagnose the local one but mention the difference.
2. **Classify** using `failure-triage.md`:
   - **Environmental / data** (credentials, lockout, network or site down, 5xx, missing browsers, missing seed data, permissions): not fixable in code. Go to step 6 for this test. Do not retry (retrying can lock the account).
   - **Code problem** (locator, strict-mode violation, stale expectation, timing the framework should cover, missing factory registration, TypeScript error): continue.
   - **Possible product bug**: continue to step 5 to confirm with the live app first.
3. **Inspect the live app with Playwright MCP** whenever the cause involves what's on the page (locator not found, strict mode, text/URL mismatch). The `mcp__playwright__*` tools may need loading via ToolSearch. Navigate to `BASE_URL` from `src/eventhub/config.ts`, log in with `USER` if the flow needs it, replay the test's steps and take `browser_snapshot` where it fails. Compare the snapshot (roles, names, labels, text) with what the page object or spec expects. If the Playwright MCP tools are unavailable, say so and rely on the Playwright trace/error-context from the local run rather than guessing.
4. State the diagnosis in one sentence backed by evidence (error line plus what the snapshot showed). If you can't, you're guessing: go to step 6.

## Step 5: Fix (max 2 attempts per test)

Is the *test* wrong or the *app* wrong?

- **Test wrong** (the app still does something reasonable, the test's locator/expectation is outdated): fix in the correct layer, following the conventions (locators in page objects, assertions in specs; prefer role/label locators; `PageFactory` getter for any new page). Touch the minimum.
- **App wrong** (the scenario's intent is no longer met, e.g. a validation message disappeared, a redirect broke): the test is right. Don't edit it. Report a probable product defect (step 6).

After each fix, re-run the single test, then the whole tag to check neighbours:

```bash
npx playwright test --project=chromium --grep @<tag>
```

Confirm the test was actually executed and passed. If it still fails, make one more evidence-based attempt (fresh snapshot, new reasoning). After 2 failed attempts, stop and go to step 6. Leave the code in place and say it is not green.

If the fix changes framework structure, tags or conventions, update the matching `.ai_documentation/` file in the same change (CLAUDE.md requires it).

## Step 6: Tell the user what isn't fixable

For each target you could not or should not fix, give: test, error line, classification (environmental / data / product defect / not reproducible / unfixed after 2 attempts), your evidence, and what the user needs to do (e.g. set `EVENTHUB_EMAIL`, seed an event, raise a bug, suggest `test.fail()` with a comment and let them decide).

## Final report

Keep it short:

- Mode used, report commit synced (if step 1 ran) and counts: failures / new / recurring / flaky
- Trend: recurring and flaky tests by name only
- Per target, one row: test -> `FIXED` (files changed, what and why, run result), `NEEDS YOU` (classification and action) or `NOT REPRODUCIBLE`
- Anything inferred that the user should double-check
- Remind that nothing was committed
