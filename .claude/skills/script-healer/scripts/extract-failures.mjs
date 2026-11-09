// Reads the JSON written by the allure-report MCP `list_failed_tests` and prints a compact
// triage view: the trend of ALL failing tests (one line each), then full detail (file, test,
// tag, trend, reason) for the targets only, so the agent's context stays small. Zero dependencies.
//
// Usage: node extract-failures.mjs <failed-tests.json> [--ids=<id1,id2,...>] [--max-reason=<chars>]
//   default : targets = NEW failures.
//   --ids   : targets = failing tests matching any identifier (case-insensitive substring of the
//             spec file, test name, full name, tag or uid), regardless of trend. Identifiers that
//             match no failing test are listed as UNMATCHED (the test may pass in the report, or
//             the identifier is wrong) so the caller can still try them locally.
//   Writes <input>-targets.json next to the input and prints a text summary.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const idsFlag = args.find((a) => a.startsWith('--ids='));
const ids = idsFlag ? idsFlag.slice(6).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) : [];
const maxFlag = args.find((a) => a.startsWith('--max-reason='));
const maxReason = maxFlag ? Number(maxFlag.split('=')[1]) : 800;

const fail = (m) => { console.error(`extract-failures error: ${m}`); process.exit(1); };
if (!input) fail('missing input. Usage: extract-failures.mjs <failed-tests.json>');

let data;
try { data = JSON.parse(readFileSync(resolve(input), 'utf8')); }
catch (e) { fail(`cannot read/parse ${input}: ${e.message}`); }
if (!data || !Array.isArray(data.tests)) fail(`${input} has no "tests" array; not an allure-report MCP output`);

const failed = data.tests.filter((t) => t.outcome === 'failed');
const isNew = (t) => t.newFailure === true;
const matches = (t, id) => [t.file, t.name, t.fullName, t.tag, t.uid].some((f) => String(f ?? '').toLowerCase().includes(id));
const targets = ids.length ? failed.filter((t) => ids.some((id) => matches(t, id))) : failed.filter(isNew);
const unmatched = ids.filter((id) => !failed.some((t) => matches(t, id)));
const fresh = failed.filter(isNew);
const existing = failed.filter((t) => !isNew(t));
const clip = (s) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > maxReason ? t.slice(0, maxReason - 1) + '…' : t;
};
const trend = (t) => `${t.trend} (${t.failuresInWindow}/${t.runsInWindow})`;

const out = [];
out.push(`failures: ${failed.length}  new: ${fresh.length}  recurring: ${existing.filter((t) => t.trend === 'Recurring Failure').length}  flaky: ${existing.filter((t) => t.trend === 'Flaky').length}`);
out.push('');
out.push('## Failure trend (all failing tests)');
for (const t of failed) out.push(`- [${isNew(t) ? 'NEW' : t.trend}] ${t.file} :: ${t.name}  ${trend(t)}`);
out.push('');
out.push(ids.length ? `## Requested tests (${ids.join(', ')})` : '## New failures (to investigate)');
if (!targets.length) out.push('(none)');
targets.forEach((t, i) => {
  out.push(`${i + 1}. file: ${t.file}`);
  out.push(`   test: ${t.name}`);
  out.push(`   tag: ${t.tag ?? '(none)'}`);
  out.push(`   trend: ${isNew(t) ? 'new failure' : trend(t)}`);
  out.push(`   reason: ${clip(t.failureReason)}`);
});

if (unmatched.length) out.push(`\nUNMATCHED (no failing test in the report): ${unmatched.join(', ')}`);
const jsonOut = resolve(dirname(resolve(input)), basename(input).replace(/\.json$/, '') + '-targets.json');
writeFileSync(jsonOut, JSON.stringify(targets.map(({ history, ...rest }) => rest), null, 2));
out.push('');
out.push(`targets_json: ${jsonOut}`);
console.log(out.join('\n'));
