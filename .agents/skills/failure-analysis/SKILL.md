---
name: failure-analysis
description: Print Allure report results as per-spec text tables with test name, status, trend, and failure reason.
---

# Failure Analysis — OpenCode Skill Wrapper

**Canonical source:** `.claude/skills/failure-analysis/SKILL.md` (read that file for hard rules).

This OpenCode skill delegates to the Claude Code skill at `.claude/skills/failure-analysis/`. Executable scripts live in `.claude/skills/failure-analysis/scripts/` and are invoked via wrapper scripts here.

## Canonical Scripts

| Script | Purpose | Canonical Path |
|--------|---------|---------------|
| `sync-gh-pages.mjs` | Refresh Allure report from gh-pages | `.claude/skills/failure-analysis/scripts/sync-gh-pages.mjs` |
| `render-tables.mjs` | Render Allure results as per-spec tables | `.claude/skills/failure-analysis/scripts/render-tables.mjs` |

## Invocation

Triggered as `@failure-analysis` in OpenCode, or load via `skill` tool with id `failure-analysis`.

## Wrapper Script

Use `.agents/skills/failure-analysis/scripts/failure-analysis.ps1` to invoke the canonical scripts:

```powershell
# Render Allure tables
.\.agents\skills\failure-analysis\scripts\failure-analysis.ps1 render-tables <outputFile>

# Sync gh-pages
.\.agents\skills\failure-analysis\scripts\failure-analysis.ps1 sync-gh-pages
```

All scripts run with project root as CWD and delegate to `.claude/skills/failure-analysis/scripts/` via absolute path.
