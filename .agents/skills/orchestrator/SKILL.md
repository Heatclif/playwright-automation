---
name: orchestrator
description: Lightweight deterministic CLI runner that chains Planner → Generator → Review → Healer agents in a unified workflow. Outputs orchestrator-state.json with pipeline state and final results.
---
# Orchestrator — OpenCode Skill Wrapper

**Canonical source:** `.agents/agents/orchestrator/orchestrator.md` (read that file for the full agent definition and workflow logic).

This OpenCode skill wraps the Orchestrator agent at `.agents/agents/orchestrator/`. The skill provides a CLI entry point for running the full test generation and healing pipeline without direct model delegation.

## Invocation

Triggered as `@orchestrator` via OpenCode, or load via `skill` tool with id `orchestrator`.

## Wrapper Script

Use `.agents/skills/orchestrator/scripts/orchestrator.ps1` to invoke the orchestrator workflow:

```powershell
# Generate only (Planner → Generator)
.\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 generate --requirements input/requirements.md --openapi playwright-automation/openapi.json

# Full pipeline (Planner → Generator → Review → Healer)
.\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 full --requirements input/requirements.md --openapi playwright-automation/openapi.json --timeout 120000 --maxAttempts 2

# Heal only (on existing failures)
.\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 heal --failures plan/failure-table.txt --maxAttempts 2
```

## Workflow Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--workflow` | `generate`, `heal`, or `full` | `--workflow full` |
| `--requirements` | Path to requirements markdown | `--requirements input/requirements.md` |
| `--openapi` | Path to OpenAPI JSON spec | `--openapi playwright-automation/openapi.json` |
| `--timeout` | Test timeout in milliseconds | `--timeout 60000` |
| `--maxAttempts` | Max healing attempts per test | `--maxAttempts 2` |
| `--statePath` | Path to persist orchestrator state | `--statePath plan/orchestrator-state.json` |

**Usage example (PowerShell from playwright-automation/):**
```powershell
# Full end-to-end pipeline
.\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 full `
  --requirements input/requirements.md `
  --openapi playwright-automation/openapi.json `
  --timeout 120000 `
  --maxAttempts 2
```

This will:
1. Run the Planner agent to parse the OpenAPI spec into 100+ test scenarios
2. Run the Generator agent to convert scenarios into 81+ `.spec.ts` files
3. Run the Reviewer agent for adversarial principle-based review
4. Run the Healer agent to fix failing tests via Playwright MCP
5. Write `plan/orchestrator-state.json` with full pipeline results
6. Write `plan/summary-report.md` with metrics for the exit checkpoint