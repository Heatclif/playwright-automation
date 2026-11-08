# Adding a new tag to GitHub Actions

CI shards the suite **by tag**. Each tag in the matrix becomes its own job that runs `--grep "@<tag>"`,
uploads its own Allure results, and a final job merges them all into one report (with history) and publishes to gh-pages.

## Workflow files

| File | Role |
| --- | --- |
| `.github/workflows/regression.yml` | Entry point. Triggers (cron `30 3 * * 1-5` = 09:00 IST Mon-Fri, `workflow_dispatch`). Holds the `matrix.tag` list. |
| `.github/workflows/helper-playwright-common.yml` | Reusable. Checkout, Node, `npm ci`, install browser, run tests for one tag, upload `allure-results_<tag>` only (no per-tag report). |
| `.github/workflows/helper-post-gh-page.yml` | Reusable. Downloads every `allure-results_*`, restores history from gh-pages, generates the combined report, uploads it and publishes to gh-pages. |
| `.github/workflows/helper-claude-analysis.yml` | Reusable, optional. Checks out gh-pages into `allure-report_combined`, starts Claude Code with the `allure-report` MCP allowed, runs the `failure-analysis` skill and prints the tables in the job log and summary. |

### Artifact retention

Only the combined report is uploaded as a report (`allure-report_combined`, **5 days**). Per-tag jobs upload just
`allure-results_<tag>` and other artifacts (e.g. `failure-analysis`) use **1 day**. Keep it that way when editing workflows.

### Optional Claude analysis

`regression.yml` has a manual-run checkbox, **Use Claude for analysis?** (`use_claude_analysis`, default off). When ticked and
`combine-report` succeeded, the `claude-analysis` job runs after it. Scheduled runs never run it (no inputs).

- Needs the repo secret `ANTHROPIC_API_KEY`.
- The gh-pages content is extracted to `allure-report_combined`. This must match `ALLURE_REPORT_DIR` in `.mcp.json` (the MCP reads it).
- MCP server: `mcp/allure-report` (needs Node 24). Skill: `.claude/skills/failure-analysis`. Claude is limited to that skill, the
  `list_all_tests` tool and the two skill scripts (the sync script skips itself in GHA, since gh-pages is already checked out); the workflow itself prints `allure-analysis/all-tests-tables.txt`.

Only `regression.yml` needs editing to add a tag. The helpers are generic and use the tag as an input.

## Steps

1. **Tag the spec** (see `spec-writing-conventions.md`): `test.describe('Name', { tag: '@my_tag' }, ...)`.
2. **Add the tag to the matrix** in `regression.yml`, **without the `@`**:

   ```yaml
   matrix:
     tag:
       - auth
       - events
       - booking
       - admin_event
       - failing_demo
       - my_tag        # <- new
   ```

3. **Update the docs**: add the tag to the "Current tags" table in `spec-writing-conventions.md`.
4. Check it locally before pushing: `npx playwright test --project=chromium --grep @my_tag`
   (confirm it selects the expected tests and none from other specs).

## Rules and gotchas

- Matrix value is the tag **without** `@`; the common workflow adds it (`--grep "@${{ inputs.tag }}"`).
- Use only `[a-z0-9_]`. The tag becomes part of artifact names (`allure-results_<tag>`), so avoid spaces, slashes and `@`.
- `--grep` is a regex match: a tag that is a prefix of another (e.g. `event` vs `events`) will also select the longer one.
  Choose tags that are not prefixes of each other, or the same tests will run twice.
- A tag missing from the matrix will **not run in CI**. A tag in the matrix with no matching tests makes the job fail with "No tests found".
- Jobs run with `fail-fast: false`, so one failing tag does not stop the others; `combine-report` still runs (`if: !cancelled()`).
- `max-parallel` in `regression.yml` limits concurrent tag jobs; raise it if the tag list grows and runtime matters.
- To run a different browser for a tag, pass the `project` input to the common workflow (default `chromium`).
- Intentionally failing tags (`failing_demo`) turn the run red by design; leave them out of the matrix if that is not wanted.
- If a workflow file is renamed or the matrix moves, update this document in the same change.
