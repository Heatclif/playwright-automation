# review-framework-code.ps1 — OpenCode wrapper for review-framework-code skill
#
# Canonical implementation: .claude/skills/review-framework-code/SKILL.md
# This skill has no executable scripts — it provides guidance only.
# Use this wrapper to display the skill guidance, or read the canonical SKILL.md directly.

param(
  [Parameter(Mandatory=$false)]
  [string]$Command = "info"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..") -ErrorAction Stop
$canonicalSkill = Join-Path $projectRoot ".claude\skills\review-framework-code\SKILL.md"

switch ($Command) {
  "info" {
    if (-Not (Test-Path $canonicalSkill)) {
      Write-Error "Canonical SKILL.md not found at $canonicalSkill"
      exit 1
    }
    Get-Content $canonicalSkill
  }
  default {
    Write-Error "Unknown command: $command. Use: info"
    exit 1
  }
}

exit 0