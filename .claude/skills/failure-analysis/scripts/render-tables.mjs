// Reads a JSON file produced by the allure-report MCP and writes per-spec text tables.
// Prints ONLY the output path (and row counts) to stdout, never the report contents,
// so the calling agent never sees the data. Zero dependencies; runs on Node 22.6+/24.
//
// Usage: node render-tables.mjs <input.json> [output.txt] [--max-reason=<chars>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const pos = args.filter((a) => !a.startsWith('--'));
const maxFlag = flags.find((f) => f.startsWith('--max-reason='));
const maxReason = maxFlag ? Number(maxFlag.split('=')[1]) : 1000;

function fail(msg) {
  console.error(`render-tables error: ${msg}`);
  process.exit(1);
}

const input = pos[0];
if (!input) fail('missing input path. Usage: render-tables.mjs <input.json> [output.txt]');
if (!Number.isFinite(maxReason) || maxReason < 20) fail('--max-reason must be a number >= 20');

let data;
try {
  data = JSON.parse(readFileSync(resolve(input), 'utf8'));
} catch (e) {
  fail(`cannot read/parse ${input}: ${e.message}`);
}
if (!data || !Array.isArray(data.tests)) fail(`${input} has no "tests" array; not an allure-report MCP output`);

const output = resolve(pos[1] ?? resolve(dirname(resolve(input)), basename(input).replace(/\.json$/, '') + '-tables.txt'));

const oneLine = (s) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > maxReason ? t.slice(0, maxReason - 1) + '…' : t;
};
const trendText = (t) => {
  const base = `${t.trend} (${t.failuresInWindow}/${t.runsInWindow})`;
  return t.newFailure ? `${base}, new failure` : base;
};
const statusText = (t) => String(t.status ?? t.outcome ?? 'unknown').toUpperCase();

const COL_WIDTH = 50;

// Word-wrap to at most COL_WIDTH chars per line; hard-break words longer than that.
function wrap(text) {
  const lines = [];
  let cur = '';
  for (let word of String(text).split(' ')) {
    while (word.length > COL_WIDTH) {
      if (cur) { lines.push(cur); cur = ''; }
      lines.push(word.slice(0, COL_WIDTH));
      word = word.slice(COL_WIDTH);
    }
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= COL_WIDTH) cur += ' ' + word;
    else { lines.push(cur); cur = word; }
  }
  lines.push(cur);
  return lines;
}

function table(headers, rows) {
  const cells = rows.map((r) => r.map(wrap));
  const widths = headers.map((h, i) => Math.max(h.length, ...cells.map((r) => Math.max(...r[i].map((l) => l.length)))));
  const line = (parts) => '| ' + parts.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
  const sep = '|-' + widths.map((w) => '-'.repeat(w)).join('-|-') + '-|';
  const wrapped = cells.some((r) => r.some((c) => c.length > 1));
  const body = cells.flatMap((r, n) => {
    const height = Math.max(...r.map((c) => c.length));
    const out = [];
    for (let k = 0; k < height; k++) out.push(line(r.map((c) => c[k] ?? '')));
    if (wrapped && n < cells.length - 1) out.push(sep);
    return out;
  });
  return [line(headers), sep, ...body].join('\n');
}

const byFile = new Map();
for (const t of data.tests) {
  const k = t.file ?? 'unknown spec';
  if (!byFile.has(k)) byFile.set(k, []);
  byFile.get(k).push(t);
}

const s = data.summary ?? {};
const out = [
  'Allure test report',
  `Generated: ${data.generatedAt ?? 'n/a'}`,
  `Report: ${data.reportPath ?? 'n/a'}`,
  `Filter: ${data.filter ?? 'n/a'}`,
  `Trend window: ${data.trendWindow ?? 'last 5 runs'}`,
  `Totals: ${s.total ?? data.tests.length} tests | ${s.passed ?? 0} passed | ${s.failed ?? 0} failed | ${s.skipped ?? 0} skipped`,
  '',
];

const files = [...byFile.keys()].sort();
const count = (tests, f) => String(tests.filter(f).length);

// 1. Summary: one row per spec file.
out.push('# Summary', '');
out.push(table(
  ['Spec file', 'Tests', 'Passed', 'Failed', 'Recurring failure', 'Flaky', 'Stable'],
  files.map((f) => {
    const t = byFile.get(f);
    return [f, String(t.length), count(t, (x) => x.outcome === 'passed'), count(t, (x) => x.outcome === 'failed'),
      count(t, (x) => x.trend === 'Recurring Failure'), count(t, (x) => x.trend === 'Flaky'), count(t, (x) => x.trend === 'Stable')];
  }),
), '');

// 2. Detailed results: one table per spec file, then full failure messages.
out.push('# Detailed results', '');
for (const file of files) {
  const tests = byFile.get(file);
  out.push(`## ${file} (${tests.length} test${tests.length === 1 ? '' : 's'})`, '');
  out.push(table(
    ['Test case', 'Status', 'Trend', 'Failure reason'],
    tests.map((t) => [oneLine(t.name), statusText(t), trendText(t), t.outcome === 'failed' ? oneLine(t.failureReason) : '-']),
  ), '');
}

try {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, out.join('\n'));
} catch (e) {
  fail(`cannot write ${output}: ${e.message}`);
}
console.log(`tables_file: ${output}`);
console.log(`spec_files: ${byFile.size}`);
console.log(`tests: ${data.tests.length}`);
