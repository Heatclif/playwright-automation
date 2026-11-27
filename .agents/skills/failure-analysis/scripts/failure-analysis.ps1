# failure-analysis.ps1 — OpenCode wrapper for failure-analysis skill
#
# Canonical implementation: .claude/skills/failure-analysis/
# Delegates to scripts in .claude/skills/failure-analysis/scripts/ via absolute path.
#
# Usage:
#   .\scripts\failure-analysis.ps1 render-tables <outputFile>
#   .\scripts\failure-analysis.ps1 sync-gh-pages

param(
  [Parameter(Mandatory=$true)]
  [string]$Command,

  [Parameter(Mandatory=$false)]
  [string[]]$Args = @()
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..\..") -ErrorAction Stop

$canonicalScriptsDir = Join-Path $projectRoot ".claude\skills\failure-analysis\scripts"

if (-Not (Test-Path $canonicalScriptsDir)) {
  Write-Error "Canonical scripts directory not found at $canonicalScriptsDir"
  exit 1
}

switch ($Command) {
  "render-tables" {
    $script = "render-tables.mjs"
    if ($Args.Count -eq 0) {
      Write-Error "Usage: failure-analysis.ps1 render-tables <outputFile>"
      exit 1
    }
  }
  "sync-gh-pages" { $script = "sync-gh-pages.mjs" }
  default {
    Write-Error "Unknown command: $command. Use: render-tables, sync-gh-pages"
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