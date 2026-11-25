import SwaggerParser = require('@apidevtools/swagger-parser');
import { extname, resolve } from 'node:path';

export interface OpenApiDocument {
  openapi: string;
  info: Record<string, unknown>;
  paths: Record<string, unknown>;
  security?: unknown;
}

type SwaggerDocument = Awaited<ReturnType<typeof SwaggerParser.parse>>;

const parserOptions: SwaggerParser.Options = {
  resolve: {
    external: false,
    http: false,
  },
};

const exampleValueKeys = new Set(['example', 'examples', 'default', 'enum', 'const']);

export async function loadOpenApiDocument(filePath: string): Promise<OpenApiDocument> {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(filePath)) {
    throw new Error('OpenAPI input must be a local file path; remote URLs are not supported.');
  }

  const extension = extname(filePath).toLowerCase();
  if (!['.json', '.yaml', '.yml'].includes(extension)) {
    throw new Error(`Unsupported OpenAPI file extension "${extension || '(none)'}". Use .json, .yaml, or .yml.`);
  }

  const absolutePath = resolve(filePath);
  let document: SwaggerDocument;

  try {
    document = await SwaggerParser.parse(absolutePath, parserOptions);
  } catch (error) {
    throw new Error(`Unable to parse OpenAPI file "${absolutePath}": ${errorMessage(error)}`);
  }

  const version = openApiVersion(document);
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid OpenAPI document: expected a semantic "openapi" version such as "3.0.0".');
  }
  if (!version.startsWith('3.0.')) {
    throw new Error(`Unsupported OpenAPI version "${version}"; supported versions are 3.0.x.`);
  }

  const externalReference = findExternalReference(document);
  if (externalReference) {
    throw new Error(
      `External $ref "${externalReference.ref}" at ${externalReference.pointer} is not allowed. Only internal references are supported.`
    );
  }

  try {
    const validated = await SwaggerParser.validate(document, parserOptions);
    if (!isOpenApiDocument(validated)) {
      throw new Error('Validated OpenAPI document is missing required "info" or "paths" objects.');
    }
    return validated;
  } catch (error) {
    throw new Error(`Invalid OpenAPI 3.0 document "${absolutePath}": ${errorMessage(error)}`);
  }
}

function openApiVersion(document: unknown): unknown {
  if (!isRecord(document)) {
    return undefined;
  }
  return document.openapi;
}

function findExternalReference(
  root: unknown
): { ref: string; pointer: string } | undefined {
  const pending: Array<{ value: unknown; pointer: string }> = [{ value: root, pointer: '#' }];
  const visited = new WeakSet<object>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    const value = current.value;
    if (!value || typeof value !== 'object') {
      continue;
    }

    if (visited.has(value)) {
      continue;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        pending.push({ value: item, pointer: `${current.pointer}/${index}` });
      });
      continue;
    }

    if (!isRecord(value)) {
      continue;
    }

    const record = value;
    const reference = record['$ref'];
    if (
      typeof reference === 'string' &&
      reference !== '#' &&
      !reference.startsWith('#/')
    ) {
      return {
        ref: reference,
        pointer: `${current.pointer}/$ref`,
      };
    }

    for (const [key, value] of Object.entries(record)) {
      if (!exampleValueKeys.has(key)) {
        pending.push({
          value,
          pointer: `${current.pointer}/${escapePointerSegment(key)}`,
        });
      }
    }
  }
}

function escapePointerSegment(value: string): string {
  return value.replace(/~/g, '~0').replace(/\//g, '~1');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  return (
    isRecord(value) &&
    typeof value.openapi === 'string' &&
    isRecord(value.info) &&
    isRecord(value.paths)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
