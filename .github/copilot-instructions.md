# GitHub Copilot Instructions

**Canonical registry:** [AGENTS.md](../AGENTS.md)  
**Framework conventions:** [.ai_documentation/README.md](../.ai_documentation/README.md)

## Agents & Skills

- **Agent definitions (single source of truth):** `.agents/agents/<name>/<name>.md` (`orchestrator`, `planner`, `generator`, `reviewer`, `healer`, `vidura`) — see `AGENTS.md` for the full registry and roles.
- **Canonical skills:** `.claude/skills/<name>/SKILL.md` (`add-playwright-test`, `review-framework-code`, `script-healer`, `failure-analysis`, `git-commit`), plus `.agents/skills/` (`orchestrator`, `workflow-router`).
- **Canonical paths:**
  - Inputs: `artifacts/inputs/requirements.md`, `artifacts/inputs/openapi.json`
  - Cross-sprint RTM: `artifacts/rtm/rtm.json`
  - Sprint outputs: `artifacts/outputs/sprint<N>/`
  - Playwright specs: `tests/eventhub/ui/` and `tests/eventhub/api/`
