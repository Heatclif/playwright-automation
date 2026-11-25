---
name: review-framework-code
description: Review framework changes against conventions in .ai_documentation/. Reports findings only; does not edit files unless asked.
---

# Review Framework Code — OpenCode Skill Wrapper

**Canonical source:** `.claude/skills/review-framework-code/SKILL.md` (read that file for full workflow).

This OpenCode skill delegates to the Claude Code skill at `.claude/skills/review-framework-code/`. There are no executable scripts in this skill — it provides guidance only. Read the canonical SKILL.md for:

- Step 1: Pick scope (files, branch, PR, or working tree)
- Step 2: Spawn reviewer subagent with diff and conventions
- Step 3: Report findings with severity groups, path:line, rule, fix
- Step 4: Fixes only on request

## Invocation

Triggered as `@review-framework-code` in OpenCode, or load via `skill` tool with id `review-framework-code`.

## Wrapper Script

No executable scripts exist for this skill in `.claude/skills/review-framework-code/`. Use `.agents/skills/review-framework-code/scripts/review-framework-code.ps1` to display the skill guidance, or read `.claude/skills/review-framework-code/SKILL.md` directly.
