// Refreshes the local Allure report folder from the latest gh-pages branch, for runs on a personal computer.
// Skips itself in GitHub Actions (the workflow already checks gh-pages out). Prints only status lines,
// never report contents. Zero dependencies.
//
// Usage: node sync-gh-pages.mjs [--dir=<report folder, relative to repo root>]   (default: allure-report_combined)
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

function fail(msg) {
  console.error(`sync-gh-pages error: ${msg}`);
  process.exit(1);
}
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

if (process.env.GITHUB_ACTIONS === 'true') {
  console.log('sync: skipped (running in GitHub Actions, gh-pages is already checked out)');
  process.exit(0);
}

const dirArg = process.argv.slice(2).find((a) => a.startsWith('--dir='));
const rel = dirArg ? dirArg.slice('--dir='.length) : 'allure-report_combined';

let root;
try {
  root = git('rev-parse', '--show-toplevel');
} catch (e) {
  fail(`not inside a git repository: ${(e.stderr || e.message).toString().trim()}`);
}
const target = resolve(root, rel);
if (!target.startsWith(root + '/')) fail(`--dir must be inside the repository (got ${target})`);

try {
  git('-C', root, 'fetch', 'origin', 'gh-pages');
} catch (e) {
  fail(`git fetch origin gh-pages failed: ${(e.stderr || e.message).toString().trim()}`);
}

// Only ever replace a folder that is missing or already looks like an Allure report, so a wrong --dir can't wipe real work.
if (existsSync(target) && !existsSync(resolve(target, 'data/test-cases'))) {
  fail(`${target} exists but is not an Allure report (no data/test-cases). Refusing to overwrite it.`);
}

const staging = `${target}.sync-tmp`;
try {
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  execSync(`git -C "${root}" archive origin/gh-pages | tar -x -C "${staging}"`, { stdio: ['ignore', 'ignore', 'pipe'], shell: '/bin/bash' });
  if (!existsSync(resolve(staging, 'data/test-cases'))) fail('origin/gh-pages does not contain data/test-cases; it is not a published Allure report.');
  rmSync(target, { recursive: true, force: true });
  renameSync(staging, target);
} catch (e) {
  rmSync(staging, { recursive: true, force: true });
  fail(`could not extract origin/gh-pages into ${target}: ${(e.stderr || e.message).toString().trim()}`);
}

console.log(`sync: updated ${target}`);
console.log(`gh_pages_commit: ${git('-C', root, 'rev-parse', '--short', 'origin/gh-pages')}`);
