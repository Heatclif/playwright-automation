import { expect, test } from '../../../src/eventhub/api/api-fixtures';
import { parsePlannerOutput } from '../../../src/eventhub/agents/planner/output-validator';

const documentedExample: unknown = require('../../../.ai_documentation/planner-output.example.json');

test.describe('Planner output contract @api_planner_contract', () => {
  test('accepts the documented PlannerOutput v1 example', () => {
    const output = parsePlannerOutput(documentedExample);

    expect(output.contractVersion).toBe('1.0');
    expect(output.testCases).toHaveLength(1);
    expect(output.testCases[0].executionReadiness).toBe('ready');
  });

  test('rejects missing required fields', () => {
    expect(() => parsePlannerOutput({})).toThrow(/Invalid PlannerOutput v1/);
  });

  test('rejects additional fields', () => {
    const output = parsePlannerOutput(documentedExample);

    expect(() => parsePlannerOutput({ ...output, unexpected: true })).toThrow(
      /Invalid PlannerOutput v1/
    );
  });

  test('rejects unsupported test case categories', () => {
    const output = parsePlannerOutput(documentedExample);
    const invalidOutput = {
      ...output,
      testCases: output.testCases.map((testCase) => ({
        ...testCase,
        category: 'unsupported',
      })),
    };

    expect(() => parsePlannerOutput(invalidOutput)).toThrow(/category/);
  });

  test('rejects ready cases with an undocumented expected status', () => {
    const output = parsePlannerOutput(documentedExample);
    const invalidOutput = {
      ...output,
      testCases: output.testCases.map((testCase) => ({
        ...testCase,
        expected: {
          statusCode: null,
          statusCodeSource: 'unspecified',
          responseSchema: null,
        },
        executionReadiness: 'ready',
      })),
    };

    expect(() => parsePlannerOutput(invalidOutput)).toThrow(/executionReadiness/);
  });

  test('accepts undocumented expectations only when the case needs an oracle', () => {
    const output = parsePlannerOutput(documentedExample);
    const needsOracleOutput = {
      ...output,
      testCases: output.testCases.map((testCase) => ({
        ...testCase,
        expected: {
          statusCode: null,
          statusCodeSource: 'unspecified',
          responseSchema: null,
        },
        executionReadiness: 'needs_oracle',
      })),
    };

    expect(parsePlannerOutput(needsOracleOutput).testCases[0].executionReadiness).toBe(
      'needs_oracle'
    );
  });
});
