import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '../../../src/eventhub/api/api-fixtures';
import { analyzeOpenApiFile } from '../../../src/eventhub/agents/planner/operation-analyzer';
import type { AnalyzedApiOperation } from '../../../src/eventhub/agents/planner/operation-analyzer';

const analyzerSpec = {
  openapi: '3.0.0',
  info: { title: 'Planner analyzer API', version: '1.0.0' },
  security: [{ bearerAuth: [] }],
  paths: {
    '/items/{itemId}': {
      parameters: [
        {
          name: 'itemId',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        },
        {
          name: 'filter',
          in: 'query',
          schema: { type: 'string', minLength: 2 },
        },
      ],
      get: {
        operationId: 'getItem',
        summary: 'Get an item',
        tags: ['Items'],
        parameters: [
          {
            name: 'filter',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['active', 'archived'] },
          },
          {
            name: 'X-Trace',
            in: 'header',
            schema: { type: 'string', pattern: '^[A-Z]+$' },
          },
        ],
        responses: {
          '200': {
            description: 'Item found',
            headers: {
              'X-Rate-Limit': {
                schema: { type: 'integer', minimum: 0 },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Item' },
              },
            },
          },
          '4XX': {
            description: 'Client error',
          },
        },
      },
      post: {
        summary: 'Create an item',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 40 },
                },
              },
            },
            'text/plain': {
              schema: { type: 'string', maxLength: 100 },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Item: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string', minLength: 2 },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
};

async function analyzeFixture(): Promise<AnalyzedApiOperation[]> {
  const directory = await mkdtemp(join(tmpdir(), 'planner-analyzer-'));
  const filePath = join(directory, 'spec.json');

  try {
    await writeFile(filePath, JSON.stringify(analyzerSpec), 'utf8');
    return await analyzeOpenApiFile(filePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function findOperation(
  operations: AnalyzedApiOperation[],
  method: string,
  path: string
): AnalyzedApiOperation {
  const operation = operations.find((item) => item.method === method && item.path === path);
  if (!operation) {
    throw new Error(`Missing analyzed operation ${method} ${path}.`);
  }
  return operation;
}

test.describe('Planner operation analyzer @api_planner_analyzer', () => {
  test('extracts each HTTP method and applies operation-level parameter overrides', async () => {
    const operations = await analyzeFixture();
    const path = '/items/{itemId}';
    const get = findOperation(operations, 'GET', path);
    const post = findOperation(operations, 'POST', path);

    expect(operations.map(({ method }) => method)).toEqual(['GET', 'POST']);
    expect(get.operationId).toBe('getItem');
    expect(get.summary).toBe('Get an item');
    expect(get.tags).toEqual(['Items']);
    expect(get.parameters.map(({ name, location }) => [name, location])).toEqual([
      ['itemId', 'path'],
      ['filter', 'query'],
      ['X-Trace', 'header'],
    ]);

    const filter = get.parameters.find(({ name }) => name === 'filter');
    expect(filter?.required).toBe(true);
    expect(filter?.schema).toMatchObject({ enum: ['active', 'archived'] });
    expect(get.parameters[0].schema).toMatchObject({ minimum: 1 });
    expect(post.operationId).toBeUndefined();
  });

  test('analyzes request-body requiredness, media types, and schema constraints', async () => {
    const operations = await analyzeFixture();
    const post = findOperation(operations, 'POST', '/items/{itemId}');

    expect(post.requestBody?.required).toBe(true);
    expect(post.requestBody?.content.map(({ mediaType }) => mediaType)).toEqual([
      'application/json',
      'text/plain',
    ]);
    expect(post.requestBody?.content[0].schema).toMatchObject({
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 40 },
      },
    });
  });

  test('preserves response status keys, headers, media types, and resolved schemas', async () => {
    const operations = await analyzeFixture();
    const get = findOperation(operations, 'GET', '/items/{itemId}');

    expect(get.responses.map(({ statusKey }) => statusKey)).toEqual(['200', '4XX']);
    expect(get.responses[0].headers[0]).toMatchObject({
      name: 'X-Rate-Limit',
      schema: { type: 'integer', minimum: 0 },
    });
    expect(get.responses[0].content[0]).toMatchObject({
      mediaType: 'application/json',
      schema: {
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string', minLength: 2 },
        },
      },
    });
  });

  test('uses operation security when present and otherwise inherits document security', async () => {
    const operations = await analyzeFixture();

    expect(findOperation(operations, 'GET', '/items/{itemId}').security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(findOperation(operations, 'POST', '/items/{itemId}').security).toEqual([]);
  });
});
