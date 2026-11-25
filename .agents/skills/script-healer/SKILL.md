---
name: script-healer
description: Heal failing Playwright scripts. Reproduce, classify, fix or report failing tests.
---

# Script Healer — OpenCode Skill Wrapper

**Canonical source:** `.claude/skills/script-healer/SKILL.md` (read that file for hard rules).

This OpenCode skill delegates to the Claude Code skill at `.claude/skills/script-healer/`. Executable scripts live in `.claude/skills/script-healer/scripts/` and are invoked via wrapper scripts here.

## Canonical Scripts

| Script | Purpose | Canonical Path |
|--------|---------|---------------|
| `extract-failures.mjs` | Extract trend and targets from Allure output | `.claude/skills/script-healer/scripts/extract-failures.mjs` |

## Invocation

Triggered as `@script-healer` in OpenCode, or load via `skill` tool with id `script-healer`.

## Wrapper Script

Use `.agents/skills/script-healer/scripts/script-healer.ps1` to invoke the canonical scripts:

```powershell
# Extract failures from Allure output
.\.agents\skills\script-healer\scripts\script-healer.ps1 extract-failures <outputFile>

# Extract specific test IDs
.\.agents\skills\script-healer\scripts\script-healer.ps1 extract-failures <outputFile> --ids=<id1,id2,...>
```

All scripts run with project root as CWD and delegate to `.claude/skills/script-healer/scripts/` via absolute path.
