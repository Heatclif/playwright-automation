---
name: workflow-router
description: Central decision logic that routes the orchestrator to the correct stage/mode combo based on RTM state
---

# Workflow Router Skill — Central Decision Logic

**Purpose:** Central decision logic that routes the orchestrator to the correct stage/mode combo based on RTM state. This skill encapsulates all stage‑routing logic, enabling the orchestrator to stay thin and deterministic.

**Inputs:**
- `rtmPath` — File path to `rtm/rtm.json` (Requirements Traceability Matrix on disk)
- `currentStage` — Current orchestrator stage (`planner`, `generator`, `review`, `heal`, `full`, `manual-review`, `planner-only`)
- `mode` — Generator mode (`manual|both|specs`), defaults to `"both"`
- `qualityGate` — Quality gate condition string (e.g., `"passRate>=95%"`), defaults to `"passRate>=95%"`

**Decision Logic (priority order):**

1. **If any RTM entry `status: "planned"`** → return `nextStage: "planner"`
   - RTM not yet populated; planner must run to identify gaps and set statuses.

2. **If all RTM entries `status: "manual-reviewed"` AND `mode: "manual"`** → return `nextStage: "review-manuals"`
   - All acceptance criteria have been manually reviewed; transition to manual review stage.

3. **If all RTM entries `status: "automated-generated"`** → return `nextStage: "review-heal"`
   - Automation specs have been generated and reviewed; transition to reviewer + healer stage.

4. **If reviewer findings exist AND `healer.healRate < 80%`** → return `nextStage: "heal-loop"` (decrement `maxIterations`)
   - Healer success rate below threshold; enter healing loop with decremented iteration count.

5. **If `maxIterations == 0`** → return `nextStage: "exit"` with partial status summary
   - Maximum iterations reached; exit with reported gaps and status.

6. **Else** → return `nextStage: "continue"` with current stage
   - No routing decision needed; proceed with current stage logic.

**Output JSON format:**

```json
{
  "nextStage": "planner|review-manuals|review-heal|heal-loop|exit|continue",
  "mode": "manual|both|specs",
  "loop": true|false,
  "maxIterationsRemaining": <number>,
  "reason": "<string>"
}
```

**Invocation (within orchestrate.ts, before each stage):**

```typescript
const routing = await runSkill("workflow-router", {
  rtmPath: "rtm/rtm.json",
  currentStage: stage,
  mode: mode || "both",
  qualityGate: qualityGate || "passRate>=95%"
});

// Apply routing decision:
switch (routing.nextStage) {
  case "planner":
    await runStage("planner", inputs);
    break;
  case "review-manuals":
    await runStage("generator", { mode: "manual", ... });
    await runStage("review", { source: "manual", ... });
    break;
  case "review-heal":
    await runStage("review", { source: "spec", ... });
    await runStage("heal", { maxAttempts: maxHealingAttempts, ... });
    break;
  case "heal-loop":
    // Decrement maxIterations and continue
    await runStage("heal", { maxAttempts: Math.max(1, maxHealingAttempts - 1), ... });
    break;
  case "exit":
    // Produce final summary and exit
    produceSummaryReport();
    process.exit(0);
    break;
  case "continue":
    // Proceed with current stage logic
    await runCurrentStageLogic();
    break;
}
```

**Edge Case Handling:**

- **First run — no RTM yet:** If `rtm/rtm.json` does not exist, create blank RTM file with `[]` (empty array) and return `nextStage: "planner"` to populate it with initial acceptance criteria. The planner will add first entries with `status: "planned"`.
- **RTM missing `status` field on some entries:** Default missing entries to `"planned"` and log warning; rewrite RTM with default statuses.
- **RTM is empty array:** Treat as no entries planned → run planner stage to populate initial ACs and RTM entries.
- **Mixed statuses (some `"planned"`, some `"automated-generated"):** Priority 1 (`any "planned"`) triggers planner — verified in logic.
- **Healer agent not yet created (pending):** Step 4 references `healer.healRate`; if healer returns incomplete data, router defaults to `"continue"` and logs warning.

**Dependencies:**
- Requires `rtm/rtm.json` with `status` field in every entry (see RTM schema update).
- Relies on reviewer and healer agent outputs for steps 4 and 5.