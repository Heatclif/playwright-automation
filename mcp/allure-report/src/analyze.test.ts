import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { classifyTrend, loadResults } from './analyze.ts';

test('trend rules', () => {
  assert.equal(classifyTrend(['broken', 'failed', 'broken', 'broken', 'failed']), 'Recurring Failure');
  assert.equal(classifyTrend(['broken', 'passed', 'broken', 'broken', 'broken']), 'Flaky');
  assert.equal(classifyTrend(['passed', 'passed', 'passed']), 'Stable');
  assert.equal(classifyTrend([]), 'Stable');
});

test('sample report', () => {
  const r = loadResults(resolve(import.meta.dirname, '../../../allure-report_combined'));
  assert.equal(r.length, 14);
  const bad = r.find((t) => t.name.startsWith('always fails'))!;
  assert.equal(bad.trend, 'Recurring Failure');
  assert.match(bad.failureReason!, /toHaveURL/);
  assert.match(bad.failureReason!, /Test timeout of 30000ms/);
});
