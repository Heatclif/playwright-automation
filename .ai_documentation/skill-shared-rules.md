# Shared rules for AI skills

Rules that apply to more than one skill in `.claude/skills/`. Skills link to a section here instead of restating it, so
there is one place to change. A skill may add stricter rules of its own, never weaker ones.

Used by: `failure-analysis` (sections 1, 2), `script-healer` (1, 2, 3, 4), `add-playwright-test` (3, 4), `review-framework-code` (3, 4), `git-commit` (4).

## 1. Allure report data

Applies to any skill that uses the `allure-report` MCP.

- **Don't read the raw report JSON** the MCP writes (no Read/cat/head/grep/jq on it) and never pass `includeInline: true`.
  It can be large and would waste context. Handle file *paths*, and read only the output of the skill's own coded script.
- Keep the file paths from each step so later steps (and the user) can use them.

## 2. Stop and report on infrastructure failure

If the `allure-report` MCP is missing, not connected or not approved, a tool returns `isError`, a skill script exits
non-zero, or a path from a previous step doesn't exist: **stop immediately**. Tell the user the exact error text and which
step failed.

Don't try alternatives (reading Allure files directly, starting the server by hand, writing your own parser, other MCPs,
retrying with different flags) unless the user explicitly says to. The user decides how to recover.

## 3. Never make a test green by weakening it

- No `waitForTimeout`.
- No loosened or deleted assertions.
- No `.first()` to dodge a strict-mode violation without understanding why there are several matches.
- No `test.skip` / `test.fail` without the user's say-so.

If the app behaves differently from what the test expects, the test is right and the app is wrong: report a probable
product defect, don't edit the assertion to match. Fixes must be based on evidence (the error output or a fresh
`browser_snapshot`), not a guess.

## 4. Git

No commits and no pushes unless the user asks. Leave changes in the working tree for review.
