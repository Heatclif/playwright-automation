# orchestrator.ps1 — OpenCode wrapper for orchestrator skill
#
# Canonical implementation: .agents/agents/orchestrator/orchestrator.md
# Delegates to scripts/orchestrate.ts via npx tsx.
#
# Usage (from playwright-automation/ directory):
#   .\.agents\skills\orchestrator\scripts\orchestrator.ps1 -Workflow planner-only
#   .\.agents\skills\orchestrator\scripts\orchestrator.ps1 -Workflow manual-review
#   .\.agents\skills\orchestrator\scripts\orchestrator.ps1 -Workflow full -RequirementsPath artifacts/inputs/requirements.md -OpenApiPath artifacts/openapi.json
#
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("planner", "generator", "review", "heal", "full", "manual-review", "planner-only", "route")]
  [string]$Workflow,

  [Parameter(Mandatory=$false)]
  [int]$Sprint = 1,

  [Parameter(Mandatory=$false)]
  [string]$RequirementsPath = "artifacts/inputs/requirements.md",

  [Parameter(Mandatory=$false)]
  [string]$OpenApiPath = "artifacts/inputs/openapi.json",

  [Parameter(Mandatory=$false)]
  [string]$Mode = "both",

  [Parameter(Mandatory=$false)]
  [string]$Source = "spec",

  [Parameter(Mandatory=$false)]
  [string]$VariantMode = "automatic",

  [Parameter(Mandatory=$false)]
  [int]$MaxGapIterations = 3,

  [Parameter(Mandatory=$false)]
  [string]$GapAnalysis = "true",

  [Parameter(Mandatory=$false)]
  [string]$ReviewerIntegration = "true",

  [Parameter(Mandatory=$false)]
  [string]$Loop = "false",

  [Parameter(Mandatory=$false)]
  [int]$MaxIterations = 3,

  [Parameter(Mandatory=$false)]
  [string]$QualityGate = "passRate>=95%",

  [Parameter(Mandatory=$false)]
  [int]$MaxHealingAttempts = 2,

  [Parameter(Mandatory=$false)]
  [string]$StatePath = "artifacts/outputs/sprint1/orchestrator-state.json"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $PSCommandPath
# .agents/skills/orchestrator/scripts -> 4 levels up to repo root
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\..") -ErrorAction Stop

Push-Location $projectRoot

try {
  $tsScript = Join-Path $projectRoot "scripts/orchestrate.ts"
  if (-Not (Test-Path $tsScript)) {
    Write-Error "Orchestrator TS script not found at $tsScript"
    exit 1
  }

  $cliArgs = @(
    $Workflow,
    "--sprint", $Sprint.ToString(),
    "--requirements", $RequirementsPath,
    "--openapi", $OpenApiPath,
    "--mode", $Mode,
    "--source", $Source,
    "--variant-mode", $VariantMode,
    "--max-gap-iterations", $MaxGapIterations.ToString(),
    "--gap-analysis", $GapAnalysis,
    "--reviewer-integration", $ReviewerIntegration,
    "--loop", $Loop,
    "--maxIterations", $MaxIterations.ToString(),
    "--qualityGate", $QualityGate,
    "--maxAttempts", $MaxHealingAttempts.ToString(),
    "--statePath", $StatePath
  )

  & npx tsx $tsScript @cliArgs
  exit $LASTEXITCODE
} catch {
  Write-Error "Orchestrator workflow failed: $_"
  exit 1
} finally {
  Pop-Location
}
