import { loadOpenApiDocument } from './openapi-loader';
import type { OpenApiDocument } from './openapi-loader';
import type { HttpMethod } from './types';

type OpenApiObject = Record<string, unknown>;

const httpMethods: Array<[string, HttpMethod]> = [
  ['get', 'GET'],
  ['put', 'PUT'],
  ['post', 'POST'],
  ['delete', 'DELETE'],
  ['options', 'OPTIONS'],
  ['head', 'HEAD'],
  ['patch', 'PATCH'],
  ['trace', 'TRACE'],
];

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';

export interface AnalyzedMediaType {
  mediaType: string;
  schema: OpenApiObject | null;
}

export interface AnalyzedParameter {
  name: string;
  location: ParameterLocation;
  required: boolean;
  description?: string;
  style?: string;
  explode?: boolean;
  allowEmptyValue?: boolean;
  allowReserved?: boolean;
  schema: OpenApiObject | null;
  content: AnalyzedMediaType[];
}

export interface AnalyzedResponseHeader {
  name: string;
  required: boolean;
  description?: string;
  schema: OpenApiObject | null;
  content: AnalyzedMediaType[];
}

export interface AnalyzedRequestBody {
  required: boolean;
  content: AnalyzedMediaType[];
}

export interface AnalyzedResponse {
  statusKey: string;
  description: string;
  headers: AnalyzedResponseHeader[];
  content: AnalyzedMediaType[];
}

export interface AnalyzedApiOperation {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  tags: string[];
  security: Array<Record<string, string[]>>;
  parameters: AnalyzedParameter[];
  requestBody: AnalyzedRequestBody | null;
  responses: AnalyzedResponse[];
}

export async function analyzeOpenApiFile(filePath: string): Promise<AnalyzedApiOperation[]> {
  const document = await loadOpenApiDocument(filePath);
  return analyzeOpenApiDocument(document);
}

export function analyzeOpenApiDocument(
  document: OpenApiDocument
): AnalyzedApiOperation[] {
  const paths = asRecord(document.paths, 'OpenAPI paths');
  const operations: AnalyzedApiOperation[] = [];

  for (const [path, rawPathItem] of Object.entries(paths)) {
    if (rawPathItem === undefined) {
      continue;
    }

    const pathItem = asRecord(rawPathItem, `Path item "${path}"`);
    const pathParameters = analyzeParameters(pathItem.parameters, `Path "${path}" parameters`);

    for (const [methodKey, method] of httpMethods) {
      const rawOperation = pathItem[methodKey];
      if (rawOperation === undefined) {
        continue;
      }

      const operation = asRecord(rawOperation, `${method} ${path} operation`);
      const operationParameters = analyzeParameters(
        operation.parameters,
        `${method} ${path} parameters`
      );
      const effectiveSecurity = operation.security ?? document.security ?? [];

      operations.push({
        path,
        method,
        ...optionalStringProperty(operation, 'operationId', `${method} ${path}`),
        ...optionalStringProperty(operation, 'summary', `${method} ${path}`),
        tags: stringArray(operation.tags, `${method} ${path} tags`),
        security: analyzeSecurity(effectiveSecurity, `${method} ${path} security`),
        parameters: mergeParameters(pathParameters, operationParameters),
        requestBody: analyzeRequestBody(operation.requestBody, `${method} ${path} request body`),
        responses: analyzeResponses(operation.responses, `${method} ${path} responses`),
      });
    }
  }

  return operations;
}

function mergeParameters(
  pathParameters: AnalyzedParameter[],
  operationParameters: AnalyzedParameter[]
): AnalyzedParameter[] {
  const parameters = new Map<string, AnalyzedParameter>();

  for (const parameter of pathParameters) {
    parameters.set(parameterKey(parameter), parameter);
  }
  for (const parameter of operationParameters) {
    parameters.set(parameterKey(parameter), parameter);
  }

  return Array.from(parameters.values());
}

function parameterKey(parameter: AnalyzedParameter): string {
  return `${parameter.location}\u0000${parameter.name}`;
}

function analyzeParameters(value: unknown, context: string): AnalyzedParameter[] {
  return optionalArray(value, context).map((rawParameter, index) => {
    const parameter = asRecord(rawParameter, `${context}[${index}]`);
    const location = parameterLocation(parameter.in, `${context}[${index}].in`);

    return {
      name: requiredString(parameter.name, `${context}[${index}].name`),
      location,
      required: optionalBoolean(parameter.required, false, `${context}[${index}].required`),
      ...optionalStringProperty(parameter, 'description', `${context}[${index}]`),
      ...optionalStringProperty(parameter, 'style', `${context}[${index}]`),
      ...optionalBooleanProperty(parameter, 'explode', `${context}[${index}]`),
      ...optionalBooleanProperty(parameter, 'allowEmptyValue', `${context}[${index}]`),
      ...optionalBooleanProperty(parameter, 'allowReserved', `${context}[${index}]`),
      schema: optionalRecord(parameter.schema, `${context}[${index}].schema`),
      content: analyzeMediaTypes(parameter.content, `${context}[${index}].content`),
    };
  });
}

function analyzeRequestBody(value: unknown, context: string): AnalyzedRequestBody | null {
  if (value === undefined) {
    return null;
  }

  const requestBody = asRecord(value, context);
  return {
    required: optionalBoolean(requestBody.required, false, `${context}.required`),
    content: analyzeMediaTypes(requestBody.content, `${context}.content`),
  };
}

function analyzeResponses(value: unknown, context: string): AnalyzedResponse[] {
  return Object.entries(asRecord(value, context)).map(([statusKey, rawResponse]) => {
    const response = asRecord(rawResponse, `${context} "${statusKey}"`);

    return {
      statusKey,
      description: requiredString(response.description, `${context} "${statusKey}" description`),
      headers: analyzeResponseHeaders(
        response.headers,
        `${context} "${statusKey}" headers`
      ),
      content: analyzeMediaTypes(response.content, `${context} "${statusKey}" content`),
    };
  });
}

function analyzeResponseHeaders(value: unknown, context: string): AnalyzedResponseHeader[] {
  return Object.entries(optionalRecord(value, context) ?? {}).map(([name, rawHeader]) => {
    const header = asRecord(rawHeader, `${context} "${name}"`);

    return {
      name,
      required: optionalBoolean(header.required, false, `${context} "${name}" required`),
      ...optionalStringProperty(header, 'description', `${context} "${name}"`),
      schema: optionalRecord(header.schema, `${context} "${name}" schema`),
      content: analyzeMediaTypes(header.content, `${context} "${name}" content`),
    };
  });
}

function analyzeMediaTypes(value: unknown, context: string): AnalyzedMediaType[] {
  return Object.entries(optionalRecord(value, context) ?? {}).map(([mediaType, rawDefinition]) => {
    const definition = asRecord(rawDefinition, `${context} "${mediaType}"`);

    return {
      mediaType,
      schema: optionalRecord(definition.schema, `${context} "${mediaType}" schema`),
    };
  });
}

function analyzeSecurity(value: unknown, context: string): Array<Record<string, string[]>> {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`);
  }

  return value.map((rawRequirement, index) => {
    const requirement = asRecord(rawRequirement, `${context}[${index}]`);
    const analyzed: Record<string, string[]> = {};

    for (const [scheme, rawScopes] of Object.entries(requirement)) {
      analyzed[scheme] = stringArray(rawScopes, `${context}[${index}].${scheme}`);
    }

    return analyzed;
  });
}

function optionalArray(value: unknown, context: string): unknown[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`);
  }
  return value;
}

function stringArray(value: unknown, context: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array of strings.`);
  }
  return value.map((item, index) => requiredString(item, `${context}[${index}]`));
}

function optionalRecord(value: unknown, context: string): OpenApiObject | null {
  if (value === undefined) {
    return null;
  }
  return asRecord(value, context);
}

function asRecord(value: unknown, context: string): OpenApiObject {
  if (!isOpenApiObject(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value;
}

function isOpenApiObject(value: unknown): value is OpenApiObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, context: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${context} must be a string.`);
  }
  return value;
}

function parameterLocation(value: unknown, context: string): ParameterLocation {
  if (value === 'path' || value === 'query' || value === 'header' || value === 'cookie') {
    return value;
  }
  throw new Error(`${context} has unsupported parameter location "${String(value)}".`);
}

function optionalStringProperty<T extends string>(
  object: OpenApiObject,
  property: T,
  context: string
): Partial<Record<T, string>> {
  const value = object[property];
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'string') {
    throw new Error(`${context}.${property} must be a string.`);
  }
  const result: Partial<Record<T, string>> = {};
  result[property] = value;
  return result;
}

function optionalBoolean(value: unknown, fallback: boolean, context: string): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean.`);
  }
  return value;
}

function optionalBooleanProperty<T extends string>(
  object: OpenApiObject,
  property: T,
  context: string
): Partial<Record<T, boolean>> {
  const value = object[property];
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${context}.${property} must be a boolean.`);
  }
  const result: Partial<Record<T, boolean>> = {};
  result[property] = value;
  return result;
}
