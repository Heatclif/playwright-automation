import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '../../../src/eventhub/api/api-fixtures';
import { loadOpenApiDocument } from '../../../src/eventhub/agents/planner/openapi-loader';

const validJson = {
  openapi: '3.0.0',
  info: { title: 'Planner test API', version: '1.0.0' },
  paths: {
    '/health': {
      get: {
        responses: {
          '200': { description: 'Healthy' },
        },
      },
    },
  },
};

const validYaml = `openapi: 3.0.0
info:
  title: Planner test API
  version: 1.0.0
paths:
  /health:
    get:
      responses:
        '200':
          description: Healthy
`;

async function withSpecFile<T>(
  extension: string,
  contents: string,
  callback: (filePath: string) => Promise<T>
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'planner-openapi-'));
  const filePath = join(directory, `spec.${extension}`);

  try {
    await writeFile(filePath, contents, 'utf8');
    return await callback(filePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test.describe('Planner OpenAPI loader @api_planner_openapi', () => {
  test('loads and validates an OpenAPI JSON file', async () => {
    await withSpecFile('json', JSON.stringify(validJson), async (filePath) => {
      const document = await loadOpenApiDocument(filePath);

      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Planner test API');
    });
  });

  test('loads and validates an OpenAPI YAML file', async () => {
    await withSpecFile('yaml', validYaml, async (filePath) => {
      const document = await loadOpenApiDocument(filePath);

      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Planner test API');
    });
  });

  test('reports malformed JSON and YAML', async () => {
    await withSpecFile('json', '{not valid JSON', async (filePath) => {
      await expect(loadOpenApiDocument(filePath)).rejects.toThrow(/Unable to parse OpenAPI file/);
    });

    await withSpecFile('yaml', 'openapi: [not valid YAML', async (filePath) => {
      await expect(loadOpenApiDocument(filePath)).rejects.toThrow(/Unable to parse OpenAPI file/);
    });
  });

  test('rejects unsupported OpenAPI versions', async () => {
    const document = { ...validJson, openapi: '3.1.0' };

    await withSpecFile('json', JSON.stringify(document), async (filePath) => {
      await expect(loadOpenApiDocument(filePath)).rejects.toThrow(
        /Unsupported OpenAPI version "3\.1\.0".*3\.0\.x/
      );
    });
  });

  test('reports invalid OpenAPI 3.0 documents', async () => {
    const document = { openapi: '3.0.0', info: {}, paths: {} };

    await withSpecFile('json', JSON.stringify(document), async (filePath) => {
      await expect(loadOpenApiDocument(filePath)).rejects.toThrow(
        /Invalid OpenAPI 3\.0 document/
      );
    });
  });

  test('resolves internal schema references', async () => {
    const document = {
      ...validJson,
      paths: {
        '/pets': {
          get: {
            responses: {
              '200': {
                description: 'A pet',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Pet' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Pet: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };

    await withSpecFile('json', JSON.stringify(document), async (filePath) => {
      const loaded = await loadOpenApiDocument(filePath);

      expect(JSON.stringify(loaded.paths)).toContain('"name"');
      expect(JSON.stringify(loaded.paths)).not.toContain('$ref');
    });
  });

  test('rejects external HTTP and local file references without resolving them', async () => {
    for (const reference of [
      'https://example.invalid/schemas/Pet.json',
      '../private/schemas/Pet.yaml#/components/schemas/Pet',
    ]) {
      const document = {
        ...validJson,
        paths: {
          '/pets': {
            get: {
              responses: {
                '200': {
                  description: 'A pet',
                  content: {
                    'application/json': {
                      schema: { $ref: reference },
                    },
                  },
                },
              },
            },
          },
        },
      };

      await withSpecFile('json', JSON.stringify(document), async (filePath) => {
        await expect(loadOpenApiDocument(filePath)).rejects.toThrow(
          /External \$ref .* is not allowed/
        );
      });
    }
  });

  test('rejects remote OpenAPI input URLs', async () => {
    await expect(loadOpenApiDocument('https://example.invalid/openapi.json')).rejects.toThrow(
      /local file path/
    );
  });

  test('rejects unsupported file extensions', async () => {
    await expect(loadOpenApiDocument('openapi.txt')).rejects.toThrow(
      /Unsupported OpenAPI file extension/
    );
  });
});
