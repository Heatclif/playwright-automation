import { expect, test } from '../../../src/eventhub/api/api-fixtures';
import { generateScenarios } from '../../../src/eventhub/agents/planner/scenario-generator';
import type { AnalyzedApiOperation } from '../../../src/eventhub/agents/planner/operation-analyzer';
import type { JsonObject, PlannerTestCase } from '../../../src/eventhub/agents/planner/types';

function operation(
  responses: AnalyzedApiOperation['responses'] = [
    { statusKey: '201', description: 'Item created', headers: [], content: [] },
    { statusKey: '400', description: 'Validation error for invalid request', headers: [], content: [] },
  ]
): AnalyzedApiOperation {
  return {
    path: '/items',
    method: 'POST',
    operationId: 'createItem',
    tags: ['Items'],
    security: [],
    parameters: [],
    requestBody: {
      required: true,
      content: [
        {
          mediaType: 'application/json',
          schema: {
            type: 'object',
            required: ['name', 'quantity'],
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 6, example: 'Ada' },
              quantity: { type: 'integer', minimum: 1, maximum: 3 },
              note: { type: 'string' },
              state: { type: 'string', enum: ['draft', 'published'] },
            },
          },
        },
      ],
    },
    responses,
  };
}

function caseById(cases: PlannerTestCase[], ending: string): PlannerTestCase {
  const found = cases.find(({ id }) => id.endsWith(ending));
  if (!found) throw new Error(`Missing generated case ending in "${ending}".`);
  return found;
}

function bodyObject(testCase: PlannerTestCase): JsonObject | null {
  const body = testCase.request.body;
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? body : null;
}

test.describe('Planner scenario generation', { tag: '@api_planner_scenarios' }, () => {
  test('generates positive, negative, boundary, and edge scenarios from documented schemas', () => {
    const cases = generateScenarios([operation()]);

    expect(new Set(cases.map(({ category }) => category))).toEqual(
      new Set(['positive', 'negative', 'boundary', 'edge'])
    );
    expect(caseById(cases, 'positive-valid-application-json').expected).toMatchObject({
      statusCode: 201,
      statusCodeSource: 'openapi',
    });

    expect(
      cases.some(
        (testCase) =>
          testCase.category === 'boundary' &&
          bodyObject(testCase)?.name === 'aa'
      )
    ).toBe(true);
    expect(
      cases.some(
        (testCase) =>
          testCase.category === 'boundary' &&
          bodyObject(testCase)?.quantity === 3
      )
    ).toBe(true);
    expect(
      cases.some(
        ({ category, title }) => category === 'edge' && title.includes('includes optional body.note')
      )
    ).toBe(true);
    expect(
      cases.some(
        (testCase) => testCase.category === 'edge' && bodyObject(testCase)?.state === 'draft'
      )
    ).toBe(true);
    expect(bodyObject(caseById(cases, 'positive-valid-application-json'))?.name).toBe('Ada');
  });

  test('changes one request condition at a time for negative scenarios', () => {
    const cases = generateScenarios([operation()]);
    const baseline = caseById(cases, 'positive-valid-application-json');
    const missingName = caseById(cases, 'negative-missing-body-name');
    const wrongNameType = caseById(cases, 'negative-type-body-name');

    expect(missingName.request.body).toEqual({ quantity: 1 });
    expect(wrongNameType.request.body).toEqual({
      name: '__invalid_type__',
      quantity: 1,
    });
    expect(baseline.request.body).toEqual({
      name: 'Ada',
      quantity: 1,
    });
    expect(missingName.expected).toMatchObject({
      statusCode: 400,
      statusCodeSource: 'openapi',
    });
  });

  test('produces deterministic case IDs and serialized output', () => {
    const first = generateScenarios([operation()]);
    const second = generateScenarios([operation()]);

    expect(first.map(({ id }) => id)).toEqual(second.map(({ id }) => id));
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(new Set(first.map(({ id }) => id)).size).toBe(first.length);
  });

  test('marks undocumented expected behavior as requiring an oracle', () => {
    const cases = generateScenarios([
      operation([{ statusKey: '200', description: 'Item representation', headers: [], content: [] }]),
    ]);
    const positive = caseById(cases, 'positive-valid-application-json');

    expect(positive.expected).toEqual({
      statusCode: null,
      statusCodeSource: 'unspecified',
      responseSchema: null,
    });
    expect(positive.executionReadiness).toBe('needs_oracle');
  });
});
