---
name: git-commit
description: Write and make a git commit in [PW-xxxx] format, local only, never pushes.
---

# Git Commit — OpenCode Skill Wrapper

**Canonical source:** `.claude/skills/git-commit/SKILL.md` (read that file for full message format and steps).

This OpenCode skill delegates to the Claude Code skill at `.claude/skills/git-commit/`. There are no executable scripts in this skill — it provides guidance only. Read the canonical SKILL.md for:

- Message format: `[PW-xxxx] Summary` with bullet list
- Subject line rules (~70 chars, past tense, no trailing period)
- Steps: git status → decide what to commit → get ticket number → write message → commit with heredoc
- Guardrails: Don't push/amend/rebase, don't use --no-verify, check .ai_documentation/ sync

## Invocation

Triggered as `@git-commit` in OpenCode, or load via `skill` tool with id `git-commit`.

## Wrapper Script

No executable scripts exist for this skill in `.claude/skills/git-commit/`. Use `.agents/skills/git-commit/scripts/git-commit.ps1` to display the skill guidance, or read `.claude/skills/git-commit/SKILL.md` directly.
