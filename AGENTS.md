# Agentic QA Framework — Agent & Skill Registry

This repository uses specialized QA agents defined in `.agents/agents/` (mirrored in `.claude/agents/` for Claude Code) and skills in `.agents/skills/` (canonical implementations in `.claude/skills/`).

## Registered Agents

When a user or workflow invokes one of these agents (e.g., `@orchestrator`, `@planner`, `@generator`, `@reviewer`, `@healer`, `@vidura`), load its `.md` definition and run it as a subagent (using `define_subagent` + `invoke_subagent` in Antigravity, or native subagent delegation in Claude Code / Cursor):

| Agent | Definition Path | Role |
|---|---|---|
| `@orchestrator` | `.agents/agents/orchestrator/orchestrator.md` | Coordinates Planner -> Generator -> Reviewer -> Healer workflows and `workflow-router` |
| `@planner` | `.agents/agents/planner/planner.md` | Parses `artifacts/inputs/requirements.md` and `artifacts/inputs/openapi.json` into UI & API scenarios + `artifacts/rtm/rtm.json` |
| `@generator` | `.agents/agents/generator/generator.md` | Generates manual cases and Playwright `.spec.ts` files (`tests/eventhub/ui/` and `tests/eventhub/api/`) using `@add-playwright-test` |
| `@reviewer` | `.agents/agents/reviewer/reviewer.md` | Adversarially reviews specs (14 rules + `artifacts/inputs/openapi.json`) and manual cases (`source: "manual"`) using `@review-framework-code` |
| `@healer` | `.agents/agents/healer/healer.md` | Classifies and repairs failing tests using `@script-healer` and `@failure-analysis` |
| `@vidura` | `.agents/agents/vidura/vidura.md` | Reviews Playwright TypeScript code for KISS/YAGNI/DRY/SOLID and best practices |

## Canonical Paths

- **Inputs:** `artifacts/inputs/requirements.md`, `artifacts/inputs/openapi.json`
- **Cross-Sprint RTM:** `artifacts/rtm/rtm.json`
- **Sprint Outputs:** `artifacts/outputs/sprint<N>/` (`orchestrator-state.json`, `summary-report.md`, `manual-cases.json`, `review-findings.json`, `healer-analysis.json`, `planner/`, `generator/`)
- **Playwright Specs:** `tests/eventhub/ui/` and `tests/eventhub/api/`
- **Framework Conventions:** `.ai_documentation/README.md`
