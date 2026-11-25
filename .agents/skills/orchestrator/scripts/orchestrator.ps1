# orchestrator.ps1 — OpenCode wrapper for orchestrator skill
#
# Canonical implementation: .agents/agents/orchestrator/orchestrator.md
# Delegates to scripts/orchestrate.ts via npx ts-node.
#
# Usage (from playwright-automation/ directory):
#   .\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 generate --requirements input/requirements.md --openapi playwright-automation/openapi.json
#   .\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 full --requirements input/requirements.md --openapi playwright-automation/openapi.json --timeout 120000 --maxAttempts 2
#   .\\.agents\\skills\\orchestrator\\scripts\\orchestrator.ps1 heal --failures plan/failure-table.txt --maxAttempts 2
#
param(
  [Parameter(Mandatory=$true)]
  [string]$Workflow,

  [Parameter(Mandatory=$false)]
  [string]$RequirementsPath = "input/requirements.md",

  [Parameter(Mandatory=$false)]
  [string]$OpenApiPath = "playwright-automation/openapi.json",

  [Parameter(Mandatory=$false)]
  [int]$TestTimeout = 60000,

  [Parameter(Mandatory=$false)]
  [int]$MaxHealingAttempts = 2,

  [Parameter(Mandatory=$false)]
  [string]$StatePath = "plan/orchestrator-state.json"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\") -ErrorAction Stop

# Change to project root so relative paths resolve correctly
Push-Location $projectRoot

try {
  $args = @()
  $args += "-r"
  $args += "requirements.txt"  # placeholder, not used by ts-node script
  $args += "--workflow"
  $args += $Workflow
  $args += "--requirements"
  $args += $RequirementsPath
  $args += "--openapi"
  $args += $OpenApiPath
  $args += "--timeout"
  $args += $TestTimeout.ToString()
  $args += "--maxAttempts"
  $args += $MaxHealingAttempts.ToString()
  $args += "--statePath"
  $args += $StatePath

  # Run the TypeScript orchestrator script
  $tsScript = Join-Path $projectRoot "scripts/orchestrate.ts"
  
  if (-Not (Test-Path $tsScript)) {
    Write-Error "Orchestrator TS script not found at $tsScript"
    exit 1
  }

  # Invoke with node via ts-node
  $result = & npx ts-node $tsScript @args
  
  exit $LASTEXITCODE
} catch {
  Write-Error "Orchestrator workflow failed: $_"
  exit 1
} finally {
  Pop-Location
}