import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadResults, summarize, WINDOW } from './analyze.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const defaultReport = process.env.ALLURE_REPORT_DIR ?? resolve(repoRoot, 'allure-report_combined');
const defaultOutDir = process.env.ALLURE_MCP_OUT_DIR ?? resolve(repoRoot, 'allure-analysis');

const server = new McpServer({ name: 'allure-report', version: '1.0.0' });

const inputShape = {
  reportPath: z.string().optional().describe(`Allure report folder (the one containing data/ and history/). Default: ${defaultReport}`),
  outputFile: z.string().optional().describe(`Where to write the JSON. Default: ${defaultOutDir}/<tool>.json`),
  includeInline: z.boolean().optional().describe('Also return the full JSON in the reply (default false: only summary + file path, to save context).'),
};

function run(kind: 'all' | 'passed' | 'failed', args: { reportPath?: string; outputFile?: string; includeInline?: boolean }) {
  const reportPath = resolve(args.reportPath ?? defaultReport);
  try {
    const all = loadResults(reportPath);
    const tests = kind === 'all' ? all : all.filter((r) => r.outcome === kind);
    const payload = {
      generatedAt: new Date().toISOString(),
      reportPath,
      filter: kind,
      trendWindow: `previous ${WINDOW} runs from Allure history`,
      trendRules: {
        'Recurring Failure': 'failed/broken in every run of the window',
        Flaky: 'failed/broken in at least one but not every run of the window',
        Stable: 'no failures in the window (newFailure=true marks a test that fails now for the first time)',
      },
      summary: summarize(tests),
      tests,
    };
    const outputFile = resolve(args.outputFile ?? `${defaultOutDir}/${kind}-tests.json`);
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, JSON.stringify(payload, null, 2));

    const text = { outputFile, summary: payload.summary, ...(args.includeInline ? { tests } : {}) };
    return { content: [{ type: 'text' as const, text: JSON.stringify(text, null, 2) }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Could not read Allure report at ${reportPath}: ${(e as Error).message}. Expected ${reportPath}/data/test-cases/*.json` }],
    };
  }
}

server.registerTool(
  'list_failed_tests',
  { description: 'List tests that failed/broke in the Allure report, each with its trend (Recurring Failure / Flaky / Stable from the last 5 runs) and the current failure reason. Writes JSON to a file for the next agent step.', inputSchema: inputShape },
  async (a) => run('failed', a),
);
server.registerTool(
  'list_passed_tests',
  { description: 'List tests that passed in the Allure report, each with its trend (Recurring Failure / Flaky / Stable from the last 5 runs; a passing test can still be Flaky). Writes JSON to a file for the next agent step.', inputSchema: inputShape },
  async (a) => run('passed', a),
);
server.registerTool(
  'list_all_tests',
  { description: 'List every test in the Allure report (passed and failed) with trend and failure reason. Writes JSON to a file for the next agent step.', inputSchema: inputShape },
  async (a) => run('all', a),
);

await server.connect(new StdioServerTransport());
