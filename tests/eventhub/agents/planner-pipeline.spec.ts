import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '../../../src/eventhub/api/api-fixtures';
import { buildPlannerOutput, planOpenApiFile } from '../../../src/eventhub/agents/planner/planner';
import type { OpenApiDocument } from '../../../src/eventhub/agents/planner/openapi-loader';
import { parsePlannerOutput } from '../../../src/eventhub/agents/planner/output-validator';
import type { PlannerTestCase } from '../../../src/eventhub/agents/planner/types';

const validDocument = {
  openapi: '3.0.0',
  info: { title: 'Planner pipeline API', version: '2.1.0' },
  paths: {
    '/widgets': {
      post: {
        operationId: 'createWidget',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Sample widget', minLength: 2 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Widget created' },
          '400': { description: 'Validation error for invalid request' },
        },
      },
    },
  },
};

async function withSpecFile<T>(
  extension: string,
  contents: string,
  callback: (filePath: string) => Promise<T>
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'planner-pipeline-'));
  const filePath = join(directory, `spec.${extension}`);
  try {
    await writeFile(filePath, contents, 'utf8');
    return await callback(filePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function findCase(
  testCases: PlannerTestCase[],
  category: PlannerTestCase['category']
): PlannerTestCase {
  const testCase = testCases.find((item) => item.category === category);
  if (!testCase) throw new Error(`Missing generated ${category} case.`);
  return testCase;
}

test.describe('Planner pipeline', { tag: '@api_planner_pipeline' }, () => {
  test('loads, analyzes, generates, assembles, and validates a PlannerOutput envelope', async () => {
    await withSpecFile('json', JSON.stringify(validDocument), async (filePath) => {
      const output = await planOpenApiFile(filePath);

      expect(output.contractVersion).toBe('1.0');
      expect(output.source).toEqual({
        openApiVersion: '3.0.0',
        title: 'Planner pipeline API',
        version: '2.1.0',
      });
      expect(output.testCases.length).toBeGreaterThan(1);

      const positive = findCase(output.testCases, 'positive');
      expect(positive.operation).toMatchObject({
        operationId: 'createWidget',
        method: 'POST',
        path: '/widgets',
      });
      expect(positive.request.body).toEqual({ name: 'Sample widget' });
      expect(positive.expected.statusCode).toBe(201);
      expect(positive.executionReadiness).toBe('ready');

      const negative = findCase(output.testCases, 'negative');
      expect(negative.expected.statusCode).toBe(400);
      expect(parsePlannerOutput(output)).toEqual(output);
    });
  });

  test('runs the same pipeline from YAML input', async () => {
    const yaml = `openapi: 3.0.0
info:
  title: YAML planner API
  version: 1.0.0
paths:
  /health:
    get:
      responses:
        '200':
          description: Health check successful
`;

    await withSpecFile('yaml', yaml, async (filePath) => {
      const output = await planOpenApiFile(filePath);

      expect(output.source.title).toBe('YAML planner API');
      expect(output.testCases[0].expected.statusCode).toBe(200);
      expect(parsePlannerOutput(output)).toEqual(output);
    });
  });

  test('reports PlannerOutput schema validation errors explicitly', () => {
    const invalidMetadata: OpenApiDocument = {
      openapi: '3.0.0',
      info: { title: '', version: '1.0.0' },
      paths: {},
    };

    expect(() => buildPlannerOutput(invalidMetadata)).toThrow(
      /Invalid PlannerOutput v1: .*title/
    );
    expect(() => parsePlannerOutput({})).toThrow(/Invalid PlannerOutput v1/);
  });
});
