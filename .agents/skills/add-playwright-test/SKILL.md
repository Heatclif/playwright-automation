---
name: add-playwright-test
description: Turn a test scenario and/or Playwright codegen steps into working tests in this EventHub Playwright framework (page objects, PageFactory, spec, tag, CI matrix), then run them and self-correct up to 2 times.
---

# Add a Playwright Test — OpenCode Skill Wrapper

**Canonical source:** `.claude/skills/add-playwright-test/SKILL.md` (read that file for full rules).

This OpenCode skill delegates to the Claude Code skill at `.claude/skills/add-playwright-test/`. There are no executable scripts in this skill — it provides guidance only. Read the canonical SKILL.md for the full workflow:

- Step 0: Load rules from `.ai_documentation/`
- Step 1: Choose Path A (write directly) or Path B (explore with Playwright MCP)
- Path A: Map codegen to page objects, add spec, register tag, run and fix
- Path B: Explore with Playwright MCP, then write code as in Path A
- Run and fix: Run tests, self-correct up to 2 times
- Hand-off: Stop after 2 fix attempts or environmental problems

## Invocation

Triggered as `@add-playwright-test` in OpenCode, or load via `skill` tool with id `add-playwright-test`.

## Wrapper Script

No executable scripts exist for this skill in `.claude/skills/add-playwright-test/`. Use `.agents/skills/add-playwright-test/scripts/add-playwright-test.ps1` to display the skill guidance, or read `.claude/skills/add-playwright-test/SKILL.md` directly.
