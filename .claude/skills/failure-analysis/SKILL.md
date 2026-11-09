---
name: failure-analysis
description: Print the Allure report results (passing/failing tests) as per-spec-file text tables with test name, status, trend (Recurring Failure / Flaky / Stable) and, for failures, the failure reason, written to a text file. Use whenever the user asks for the test results, a pass/fail list, a failure report, flaky or recurring failures, or "what failed in the last run" from the Allure report or the allure-report MCP, even if they don't mention tables or the skill by name.
---

# Allure test tables

Turns the `allure-report` MCP output into readable per-spec tables, **without the agent ever reading report data**. Two reasons: the JSON can be large and would waste context, and the user wants a deterministic, coded rendering rather than the model paraphrasing results.

## Hard rules

Follow `.ai_documentation/skill-shared-rules.md`, sections 1 (don't read raw Allure JSON) and 2 (stop and report on infrastructure failure). Read it before starting. This skill is stricter on section 1: you also never open the generated tables file, and only handle file *paths*. Say the paths; don't summarize the contents.

## Steps

0. **Refresh the report if running on a personal computer.** Skip this step when the user named their own report folder or the environment variable `GITHUB_ACTIONS` is `true`. Otherwise run:
   ```bash
   node .claude/skills/failure-analysis/scripts/sync-gh-pages.mjs
   ```
   It fetches the latest `origin/gh-pages` and replaces `allure-report_combined/` (the folder the MCP reads) with it, so local results match the latest published report. It prints only status lines, and it skips itself in GitHub Actions, where the workflow has already checked gh-pages out. If the script exits non-zero (no network, no `origin` remote, no `gh-pages` branch, folder isn't a report), stop per shared rule 2 and quote its error. Mention the `gh_pages_commit` it prints in the final report. Note that the local folder is overwritten, so tell the user once if it did not come from gh-pages before.

1. **Pick the MCP tool from the request:**
   - "failures", "what failed", "flaky/recurring" → `list_failed_tests`
   - "passing", "what passed" → `list_passed_tests`
   - "all", "everything", "full report", or unspecified → `list_all_tests`
   
   Pass `reportPath` only if the user named a report folder. Never pass `includeInline`.
   If no `allure-report` MCP tool is available, stop per shared rule 2 (tell the user it is not connected; it is registered in `.mcp.json` and needs approval/restart).

2. **Read the reply's `outputFile` and `summary`.** The reply is small by design (path + counts), so this is fine. Keep `outputFile` as the JSON path. If it is missing, stop per shared rule 2.

3. **Render the tables with the coded tool:**
   ```bash
   node .claude/skills/failure-analysis/scripts/render-tables.mjs <outputFile>
   ```
   The tables file lands next to the JSON as `<kind>-tests-tables.txt`. Give a second argument for a different output path, and `--max-reason=<chars>` to change the failure-reason truncation (default 1000). The script prints only `tables_file`, `spec_files` and `tests`. A non-zero exit means stop per shared rule 2.

4. **Report to the user:** the gh-pages commit that was synced (if step 0 ran), the tables file path, the JSON path, and the MCP's summary counts (total/passed/failed, recurring/flaky). Do not paste or describe table contents. If the user wants to see them, tell them to open the file.

## Output shape (for reference, you will not read it)

1. Header with report path, filter, trend window and totals.
2. `# Summary`: one row per spec file (tests, passed, failed, recurring failure, flaky, stable).
3. `# Detailed results`: one table per spec file with `Test case | Status | Trend | Failure reason`. Passing rows show `-` as the reason. Trend shows `<label> (<failures>/<runs>)` over the last 5 runs, plus `new failure` for a first-time failure. Multi-line failure messages are collapsed to one line (cut at `--max-reason`, default 1000).
