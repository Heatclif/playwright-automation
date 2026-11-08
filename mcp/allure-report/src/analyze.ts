import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Trend = 'Recurring Failure' | 'Flaky' | 'Stable';
export type Outcome = 'passed' | 'failed';

export interface HistoryRun {
  status: string;
  outcome: Outcome;
  startedAt: string;
}

export interface TestResult {
  uid: string;
  name: string;
  fullName: string;
  file: string;
  tag: string | null;
  status: string; // raw Allure status: passed | failed | broken | skipped
  outcome: Outcome | 'skipped';
  durationMs: number;
  trend: Trend;
  /** Failures within the history window (failed or broken). */
  failuresInWindow: number;
  runsInWindow: number;
  newFailure: boolean; // currently failing but no failure in window
  history: HistoryRun[]; // newest first
  failureReason: string | null;
}

/** How many previous runs the trend looks at. */
export const WINDOW = 5;

const isFail = (s: string) => s === 'failed' || s === 'broken';

/**
 * Trend rules (over the previous WINDOW runs from Allure history):
 *  - every run in the window failed          -> Recurring Failure
 *  - at least 1 but not all runs failed      -> Flaky
 *  - no failures                             -> Stable
 * With less than WINDOW runs of history, "every run" means every run available.
 */
export function classifyTrend(statuses: string[]): Trend {
  const window = statuses.slice(0, WINDOW);
  const fails = window.filter(isFail).length;
  if (window.length > 0 && fails === window.length) return 'Recurring Failure';
  if (fails >= 1) return 'Flaky';
  return 'Stable';
}

interface Step {
  name?: string;
  status?: string;
  statusMessage?: string;
  steps?: Step[];
}

/** Collect the most specific message: the failing step's text (has Expected/Received + call log). */
function failureReason(tc: any): string | null {
  const found: string[] = [];
  const walk = (steps: Step[] = []) => {
    for (const s of steps) {
      if (s.statusMessage && isFail(s.status ?? '')) found.push(s.statusMessage);
      walk(s.steps);
    }
  };
  walk(tc.testStage?.steps);
  for (const stage of [...(tc.beforeStages ?? []), ...(tc.afterStages ?? [])]) walk(stage.steps);

  const top: string | undefined = tc.statusMessage ?? tc.testStage?.statusMessage;
  const detailed = found.find((m) => m.trim().length > 0);
  if (detailed) {
    // Keep the generic timeout line too, e.g. "Test timeout of 30000ms exceeded."
    return top && !detailed.includes(top) ? `${detailed.trimEnd()}\n  - ${top}` : detailed.trimEnd();
  }
  return top ?? null;
}

export function loadResults(reportDir: string): TestResult[] {
  const dir = join(reportDir, 'data', 'test-cases');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const results: TestResult[] = [];

  for (const f of files) {
    const tc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const label = (n: string) => tc.labels?.find((l: any) => l.name === n)?.value ?? null;
    const items: any[] = tc.extra?.history?.items ?? [];
    // Newest first so slice(0, WINDOW) = the most recent runs.
    const history: HistoryRun[] = items
      .map((i) => ({ status: i.status as string, startedAt: new Date(i.time?.start ?? 0).toISOString(), t: i.time?.start ?? 0 }))
      .sort((a, b) => b.t - a.t)
      .map(({ t, ...h }) => ({ ...h, outcome: (isFail(h.status) ? 'failed' : 'passed') as Outcome }));
    const window = history.slice(0, WINDOW);
    const failuresInWindow = window.filter((h) => h.outcome === 'failed').length;
    const trend = classifyTrend(window.map((h) => h.status));
    const failing = isFail(tc.status);

    results.push({
      uid: tc.uid,
      name: tc.name,
      fullName: tc.fullName,
      file: label('suite') ?? '',
      tag: label('tag'),
      status: tc.status,
      outcome: failing ? 'failed' : tc.status === 'passed' ? 'passed' : 'skipped',
      durationMs: tc.time?.duration ?? 0,
      trend,
      failuresInWindow,
      runsInWindow: window.length,
      newFailure: failing && failuresInWindow === 0,
      history: window,
      failureReason: failing ? failureReason(tc) : null,
    });
  }
  return results.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function summarize(results: TestResult[]) {
  const count = (fn: (r: TestResult) => boolean) => results.filter(fn).length;
  return {
    total: results.length,
    passed: count((r) => r.outcome === 'passed'),
    failed: count((r) => r.outcome === 'failed'),
    skipped: count((r) => r.outcome === 'skipped'),
    recurringFailures: count((r) => r.trend === 'Recurring Failure'),
    flaky: count((r) => r.trend === 'Flaky'),
    stable: count((r) => r.trend === 'Stable'),
    newFailures: count((r) => r.newFailure),
  };
}
