# script-healer.ps1 — OpenCode wrapper for script-healer skill
#
# Canonical implementation: .claude/skills/script-healer/
# Delegates to scripts in .claude/skills/script-healer/scripts/ via absolute path.
#
# Usage:
#   .\scripts\script-healer.ps1 extract-failures <outputFile>
#   .\scripts\script-healer.ps1 extract-failures <outputFile> --ids=<id1,id2,...>

param(
  [Parameter(Mandatory=$true)]
  [string]$Command,

  [Parameter(Mandatory=$false)]
  [string[]]$Args = @()
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..") -ErrorAction Stop

$canonicalScriptsDir = Join-Path $projectRoot ".claude\skills\script-healer\scripts"

if (-Not (Test-Path $canonicalScriptsDir)) {
  Write-Error "Canonical scripts directory not found at $canonicalScriptsDir"
  exit 1
}

switch ($Command) {
  "extract-failures" {
    $script = "extract-failures.mjs"
  }
  default {
    Write-Error "Unknown command: $command. Use: extract-failures"
    exit 1
  }
}

$scriptPath = Join-Path $canonicalScriptsDir $script

if (-Not (Test-Path $scriptPath)) {
  Write-Error "Script not found: $scriptPath"
  exit 1
}

# Run from project root so .review/ and other relative paths resolve correctly
& node $scriptPath @Args

exit $LASTEXITCODE