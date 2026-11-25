import type {
  AnalyzedApiOperation,
  AnalyzedParameter,
  AnalyzedMediaType,
} from './operation-analyzer';
import type {
  JsonObject,
  JsonValue,
  PlannerTestCase,
  StatusCodeRange,
  TestCaseCategory,
} from './types';

type RequestRoot = keyof PlannerTestCase['request'];
type Segment = string | number;

interface ValuePlan {
  value: JsonValue;
  needsOracle: boolean;
}

interface Target {
  root: RequestRoot;
  path: Segment[];
  label: string;
  schema: Record<string, unknown>;
  required: boolean;
  property: boolean;
}

interface RequestPlan {
  request: PlannerTestCase['request'];
  targets: Target[];
  needsOracle: boolean;
}

interface Mutation {
  key: string;
  title: string;
  category: TestCaseCategory;
  field?: string;
  failure?: 'missing' | 'invalid' | 'minimum' | 'maximum';
  needsOracle?: boolean;
  apply: (request: PlannerTestCase['request']) => boolean;
}

const maxDepth = 8;

export function generateScenarios(
  operations: AnalyzedApiOperation[]
): PlannerTestCase[] {
  const cases: PlannerTestCase[] = [];
  const ids = new Set<string>();

  for (const operation of operations) {
    const mediaTypes = operation.requestBody?.content.length
      ? operation.requestBody.content
      : [undefined];

    mediaTypes.forEach((mediaType, index) => {
      const base = prepareRequest(operation, mediaType);
      const mediaKey = mediaType?.mediaType ?? 'no-body';

      addCase(cases, ids, operation, base, {
        key: `positive-valid-${mediaKey}`,
        title: 'valid request',
        category: 'positive',
        apply: () => true,
      });

      parameterMutations(operation).forEach((mutation) =>
        addCase(cases, ids, operation, base, mutation)
      );
      bodyMutations(operation, base).forEach((mutation) =>
        addCase(cases, ids, operation, base, mutation)
      );

      for (const target of base.targets) {
        for (const boundary of boundaryValues(target.schema)) {
          addCase(cases, ids, operation, base, {
            key: `boundary-${target.label}-${boundary.key}`,
            title: `${target.label} ${boundary.title}`,
            category: 'boundary',
            apply: (request) => setValue(request, target.root, target.path, boundary.value),
          });
        }
        for (const edge of edgeValues(target.schema)) {
          addCase(cases, ids, operation, base, {
            key: `edge-${target.label}-${edge.key}`,
            title: `${target.label} ${edge.title}`,
            category: 'edge',
            apply: (request) => setValue(request, target.root, target.path, edge.value),
          });
        }
        if (target.property && !target.required) {
          const value = validValue(target.schema);
          addCase(cases, ids, operation, base, {
            key: `edge-include-${target.label}`,
            title: `includes optional ${target.label}`,
            category: 'edge',
            needsOracle: value.needsOracle,
            apply: (request) => setValue(request, target.root, target.path, value.value),
          });
        }
        if (target.schema.nullable === true) {
          addCase(cases, ids, operation, base, {
            key: `edge-null-${target.label}`,
            title: `sets ${target.label} to null`,
            category: 'edge',
            apply: (request) => setValue(request, target.root, target.path, null),
          });
        }
      }

      if (operation.requestBody && !operation.requestBody.required && index === 0) {
        addCase(cases, ids, operation, base, {
          key: 'edge-omit-optional-body',
          title: 'omits the optional request body',
          category: 'edge',
          apply: (request) => {
            request.body = null;
            delete request.headers['Content-Type'];
            return true;
          },
        });
      }
    });
  }
  return cases;
}

function prepareRequest(
  operation: AnalyzedApiOperation,
  mediaType: AnalyzedMediaType | undefined
): RequestPlan {
  const request: PlannerTestCase['request'] = {
    pathParams: {},
    queryParams: {},
    headers: {},
    cookies: {},
    body: null,
  };
  const targets: Target[] = [];
  let needsOracle = false;

  for (const parameter of operation.parameters) {
    const schema = parameter.schema ?? parameter.content[0]?.schema;
    if (!schema) {
      if (parameter.required) needsOracle = true;
      continue;
    }

    if (parameter.required) {
      const plan = validValue(schema);
      requestCollection(request, parameter.location)[parameter.name] = plan.value;
      needsOracle ||= plan.needsOracle;
      if (parameter.location === 'path' && !documentedSample(schema)) {
        needsOracle = true;
      }
    }
    collectTargets(
      schema,
      locationRoot(parameter.location),
      [parameter.name],
      `${parameter.location}-${parameter.name}`,
      parameter.required,
      false,
      targets,
      new WeakSet<object>(),
      0
    );
  }

  if (operation.requestBody && mediaType) {
    if (request.headers['Content-Type'] !== undefined) needsOracle = true;
    else request.headers['Content-Type'] = mediaType.mediaType;
    if (mediaType.schema) {
      const plan = validValue(mediaType.schema);
      request.body = plan.value;
      needsOracle ||= plan.needsOracle;
      collectTargets(
        mediaType.schema,
        'body',
        [],
        'body',
        operation.requestBody.required,
        false,
        targets,
        new WeakSet<object>(),
        0
      );
    } else {
      needsOracle = true;
    }
  } else if (operation.requestBody?.required) {
    needsOracle = true;
  }
  return { request, targets, needsOracle };
}

function parameterMutations(operation: AnalyzedApiOperation): Mutation[] {
  const mutations: Mutation[] = [];
  for (const parameter of operation.parameters) {
    const root = locationRoot(parameter.location);
    const path = [parameter.name];
    const schema = parameter.schema ?? parameter.content[0]?.schema;
    if (parameter.required) {
      mutations.push({
        key: `negative-missing-${parameter.location}-${parameter.name}`,
        title: `omits required ${parameter.location} parameter ${parameter.name}`,
        category: 'negative',
        field: parameter.name,
        failure: 'missing',
        needsOracle: parameter.location === 'path',
        apply: (request) => removeValue(request, root, path),
      });
    }
    if (schema) mutations.push(...schemaMutations(root, path, schema, parameter.name));
    if (!parameter.required && schema) {
      const plan = validValue(schema);
      mutations.push({
        key: `edge-include-optional-${parameter.location}-${parameter.name}`,
        title: `includes optional ${parameter.location} parameter ${parameter.name}`,
        category: 'edge',
        needsOracle: plan.needsOracle,
        apply: (request) => setValue(request, root, path, plan.value),
      });
    }
  }
  return mutations;
}

function bodyMutations(operation: AnalyzedApiOperation, base: RequestPlan): Mutation[] {
  const mutations: Mutation[] = [];
  if (operation.requestBody?.required) {
    mutations.push({
      key: 'negative-missing-body',
      title: 'omits the required request body',
      category: 'negative',
      field: 'request body',
      failure: 'missing',
      apply: (request) => {
        request.body = null;
        delete request.headers['Content-Type'];
        return true;
      },
    });
  }
  for (const target of base.targets) {
    if (target.root !== 'body') continue;
    if (target.property && target.required) {
      mutations.push({
        key: `negative-missing-${target.label}`,
        title: `omits required field ${target.label}`,
        category: 'negative',
        field: target.label,
        failure: 'missing',
        apply: (request) => removeValue(request, target.root, target.path),
      });
    }
    mutations.push(...schemaMutations(target.root, target.path, target.schema, target.label));
  }
  return mutations;
}

function schemaMutations(
  root: RequestRoot,
  path: Segment[],
  schema: Record<string, unknown>,
  label: string
): Mutation[] {
  const mutations: Mutation[] = [];
  const type = schemaType(schema);
  const invalidType: JsonValue | undefined =
    type === 'string' || type === 'number' || type === 'integer'
      ? '__invalid_type__'
      : type === 'boolean' || type === 'object' || type === 'array'
        ? 'invalid'
        : undefined;
  if (invalidType !== undefined) {
    mutations.push({
      key: `negative-type-${label}`,
      title: `uses a value of the wrong type for ${label}`,
      category: 'negative',
      field: label,
      failure: 'invalid',
      needsOracle: hasOtherConstraints(schema),
      apply: (request) => setValue(request, root, path, invalidType),
    });
  }

  const outsideEnum = invalidEnumValue(schema);
  if (outsideEnum !== undefined) {
    mutations.push({
      key: `negative-enum-${label}`,
      title: `uses a value outside the documented enum for ${label}`,
      category: 'negative',
      field: label,
      failure: 'invalid',
      needsOracle: hasOtherConstraints(schema),
      apply: (request) => setValue(request, root, path, outsideEnum),
    });
  }
  for (const invalid of invalidConstraintValues(schema)) {
    mutations.push({
      key: `negative-${label}-${invalid.key}`,
      title: `${label} ${invalid.title}`,
      category: 'negative',
      field: label,
      failure: invalid.failure,
      apply: (request) => setValue(request, root, path, invalid.value),
    });
  }
  return mutations;
}

function validValue(
  schema: Record<string, unknown> | null,
  ancestors = new WeakSet<object>(),
  depth = 0
): ValuePlan {
  if (!schema || depth > maxDepth || ancestors.has(schema)) {
    return { value: null, needsOracle: true };
  }
  ancestors.add(schema);
  try {
    const unsupported = hasUnsupportedConstraint(schema);
    if (Array.isArray(schema.enum) && schema.enum.length === 0) {
      return { value: null, needsOracle: true };
    }
    const sample =
      schema.example !== undefined
        ? schema.example
        : Array.isArray(schema.enum)
          ? schema.enum[0]
          : undefined;
    if (sample !== undefined) {
      const converted = toJsonValue(sample);
      return { value: converted ?? null, needsOracle: unsupported || converted === undefined };
    }

    let value: JsonValue;
    let needsOracle = unsupported;
    switch (schemaType(schema)) {
      case 'string': {
        const format = schema.format;
        let text = format === 'email' ? 'planner@example.test'
          : format === 'date' ? '2025-01-01'
            : format === 'date-time' ? '2025-01-01T00:00:00Z'
              : format === 'uuid' ? '00000000-0000-4000-8000-000000000001'
                : format === 'uri' || format === 'url' ? 'https://example.test/'
                  : 'sample';
        const min = integerConstraint(schema.minLength);
        const max = integerConstraint(schema.maxLength);
        if (min !== undefined && text.length < min && format === undefined) {
          text += 'a'.repeat(min - text.length);
        }
        if (max !== undefined && text.length > max && format === undefined) text = text.slice(0, max);
        if (format !== undefined && !['email', 'date', 'date-time', 'uuid', 'uri', 'url'].includes(String(format))) {
          needsOracle = true;
        }
        if (
          (min !== undefined && text.length < min) ||
          (max !== undefined && text.length > max) ||
          (min !== undefined && max !== undefined && min > max)
        ) {
          needsOracle = true;
        }
        value = text;
        break;
      }
      case 'integer':
      case 'number': {
        const integer = schemaType(schema) === 'integer';
        const min = finiteNumber(schema.minimum);
        const max = finiteNumber(schema.maximum);
        const multiple = positiveNumber(schema.multipleOf);
        const step = multiple ?? (integer ? 1 : 0.1);
        const hasMinimum = min !== undefined;
        const hasMaximum = max !== undefined;
        let number = min ?? max ?? 1;
        if (hasMinimum && schema.exclusiveMinimum === true) number += step;
        else if (!hasMinimum && hasMaximum && schema.exclusiveMaximum === true) number -= step;
        if (multiple !== undefined) {
          number = hasMinimum
            ? Math.ceil(number / multiple) * multiple
            : Math.floor(number / multiple) * multiple;
        }
        if (integer) {
          number = hasMinimum ? Math.ceil(number) : Math.floor(number);
          if (hasMinimum && schema.exclusiveMinimum === true && number <= min!) number = Math.floor(min!) + 1;
          if (!hasMinimum && hasMaximum && schema.exclusiveMaximum === true && number >= max!) number = Math.ceil(max!) - 1;
        }
        const isMultiple = multiple === undefined || Math.abs(number / multiple - Math.round(number / multiple)) < 1e-9;
        if (
          !Number.isFinite(number) ||
          (integer && !Number.isInteger(number)) ||
          !isMultiple ||
          (min !== undefined && (schema.exclusiveMinimum === true ? number <= min : number < min)) ||
          (max !== undefined && (schema.exclusiveMaximum === true ? number >= max : number > max))
        ) {
          needsOracle = true;
        }
        value = number;
        break;
      }
      case 'boolean':
        value = false;
        break;
      case 'object': {
        const object: JsonObject = {};
        const properties = isRecord(schema.properties) ? schema.properties : {};
        const required = stringArray(schema.required);
        for (const key of required) {
          if (!isRecord(properties[key])) {
            needsOracle = true;
            continue;
          }
          const child = validValue(properties[key] as Record<string, unknown>, ancestors, depth + 1);
          object[key] = child.value;
          needsOracle ||= child.needsOracle;
        }
        const minProperties = integerConstraint(schema.minProperties) ?? 0;
        for (const [key, propertySchema] of Object.entries(properties)) {
          if (Object.keys(object).length >= minProperties) break;
          if (key in object || !isRecord(propertySchema)) continue;
          const child = validValue(propertySchema, ancestors, depth + 1);
          object[key] = child.value;
          needsOracle ||= child.needsOracle;
        }
        const maxProperties = integerConstraint(schema.maxProperties);
        if (
          Object.keys(object).length < minProperties ||
          (maxProperties !== undefined && Object.keys(object).length > maxProperties)
        ) {
          needsOracle = true;
        }
        value = object;
        break;
      }
      case 'array': {
        if (!isRecord(schema.items)) {
          value = [];
          needsOracle = true;
          break;
        }
        const count = integerConstraint(schema.minItems) ?? 0;
        const maxItems = integerConstraint(schema.maxItems);
        value = [];
        for (let index = 0; index < count; index += 1) {
          const child = validValue(schema.items, ancestors, depth + 1);
          value.push(child.value);
          needsOracle ||= child.needsOracle;
        }
        if (
          (maxItems !== undefined && count > maxItems) ||
          (schema.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length)
        ) {
          needsOracle = true;
        }
        break;
      }
      default:
        value = null;
        needsOracle = true;
    }
    return { value, needsOracle };
  } finally {
    ancestors.delete(schema);
  }
}

function collectTargets(
  schema: Record<string, unknown>,
  root: RequestRoot,
  path: Segment[],
  label: string,
  required: boolean,
  property: boolean,
  targets: Target[],
  ancestors: WeakSet<object>,
  depth: number
): void {
  targets.push({ root, path, label, schema, required, property });
  if (depth >= maxDepth || ancestors.has(schema)) return;
  ancestors.add(schema);
  try {
    if (root === 'body' && isRecord(schema.properties)) {
      const requiredProperties = new Set(stringArray(schema.required));
      for (const [name, child] of Object.entries(schema.properties)) {
        if (isRecord(child)) {
          collectTargets(
            child,
            root,
            [...path, name],
            `${label}.${name}`,
            requiredProperties.has(name),
            true,
            targets,
            ancestors,
            depth + 1
          );
        }
      }
    }
  } finally {
    ancestors.delete(schema);
  }
}

function boundaryValues(
  schema: Record<string, unknown>
): Array<{ key: string; title: string; value: JsonValue }> {
  const values: Array<{ key: string; title: string; value: JsonValue }> = [];
  if (schema.enum !== undefined || schema.pattern !== undefined || schema.format !== undefined) return values;
  const type = schemaType(schema);
  if (type === 'string') {
    const min = integerConstraint(schema.minLength);
    const max = integerConstraint(schema.maxLength);
    if (min !== undefined && (max === undefined || min <= max)) values.push({ key: 'min-length', title: 'at minimum length', value: 'a'.repeat(min) });
    if (max !== undefined && (min === undefined || max >= min)) values.push({ key: 'max-length', title: 'at maximum length', value: 'a'.repeat(max) });
  }
  if (type === 'integer' || type === 'number') {
    for (const edge of ['minimum', 'maximum'] as const) {
      const bound = finiteNumber(schema[edge]);
      if (bound === undefined) continue;
      const exclusive = edge === 'minimum' ? schema.exclusiveMinimum === true : schema.exclusiveMaximum === true;
      const step = positiveNumber(schema.multipleOf) ?? (type === 'integer' ? 1 : 0.1);
      let value = bound + (edge === 'minimum' ? 1 : -1) * (exclusive ? step : 0);
      const multiple = positiveNumber(schema.multipleOf);
      if (multiple !== undefined) {
        value = edge === 'minimum'
          ? Math.ceil(value / multiple) * multiple
          : Math.floor(value / multiple) * multiple;
      }
      if (
        (type !== 'integer' || Number.isInteger(value)) &&
        (edge === 'minimum' ? finiteNumber(schema.maximum) === undefined || value <= Number(schema.maximum) : finiteNumber(schema.minimum) === undefined || value >= Number(schema.minimum))
      ) {
        values.push({ key: edge, title: `at documented ${edge}`, value });
      }
    }
  }
  return uniqueByValue(values);
}

function edgeValues(
  schema: Record<string, unknown>
): Array<{ key: string; title: string; value: JsonValue }> {
  const values: Array<{ key: string; title: string; value: JsonValue }> = [];
  if (schema.nullable === true) values.push({ key: 'null', title: 'as null', value: null });
  if (
    schemaType(schema) === 'string' &&
    (integerConstraint(schema.minLength) ?? 0) === 0 &&
    schema.format === undefined &&
    schema.pattern === undefined
  ) {
    values.push({ key: 'empty-string', title: 'as an empty string', value: '' });
  }
  if (schemaType(schema) === 'array' && (integerConstraint(schema.minItems) ?? 0) === 0) {
    values.push({ key: 'empty-array', title: 'as an empty array', value: [] });
  }
  if (schemaType(schema) === 'object' && stringArray(schema.required).length === 0) {
    values.push({ key: 'empty-object', title: 'as an empty object', value: {} });
  }
  return uniqueByValue(values);
}

function invalidConstraintValues(
  schema: Record<string, unknown>
): Array<{ key: string; title: string; value: JsonValue; failure: 'minimum' | 'maximum' }> {
  const values: Array<{ key: string; title: string; value: JsonValue; failure: 'minimum' | 'maximum' }> = [];
  if (schema.enum !== undefined || schema.pattern !== undefined || schema.format !== undefined) return values;
  const type = schemaType(schema);
  if (type === 'string') {
    const min = integerConstraint(schema.minLength);
    const max = integerConstraint(schema.maxLength);
    if (min !== undefined && min > 0) {
      values.push({ key: 'short-string', title: 'is shorter than documented minLength', value: 'a'.repeat(min - 1), failure: 'minimum' });
    }
    if (max !== undefined) {
      values.push({ key: 'long-string', title: 'is longer than documented maxLength', value: 'a'.repeat(max + 1), failure: 'maximum' });
    }
  }
  if (type === 'integer' || type === 'number') {
    const step = positiveNumber(schema.multipleOf) ?? (type === 'integer' ? 1 : 0.1);
    const min = finiteNumber(schema.minimum);
    const max = finiteNumber(schema.maximum);
    if (min !== undefined) values.push({ key: 'below-min', title: 'is below documented minimum', value: schema.exclusiveMinimum === true ? min : min - step, failure: 'minimum' });
    if (max !== undefined) values.push({ key: 'above-max', title: 'is above documented maximum', value: schema.exclusiveMaximum === true ? max : max + step, failure: 'maximum' });
  }
  return values;
}

function invalidEnumValue(schema: Record<string, unknown>): JsonValue | undefined {
  if (!Array.isArray(schema.enum) || schema.enum.length === 0) return undefined;
  const type = schemaType(schema);
  if (type === 'string') {
    let candidate = '__outside_enum__';
    while (schema.enum.includes(candidate)) candidate += '_';
    return candidate;
  }
  if ((type === 'integer' || type === 'number') && schema.enum.every((value) => typeof value === 'number')) {
    return Math.max(...schema.enum as number[]) + 1;
  }
  if (type === 'boolean' && !schema.enum.includes(false)) return false;
  if (type === 'boolean' && !schema.enum.includes(true)) return true;
  return undefined;
}

function addCase(
  cases: PlannerTestCase[],
  ids: Set<string>,
  operation: AnalyzedApiOperation,
  base: RequestPlan,
  mutation: Mutation
): void {
  const request = cloneRequest(base.request);
  if (!mutation.apply(request)) return;
  const expected = expectedResponse(operation, mutation.category, mutation.field, mutation.failure);
  const needsOracle = base.needsOracle || mutation.needsOracle === true || !expected || expected.needsOracle;
  const operationKey = operation.operationId
    ? `${operation.operationId}-${operation.method}-${operation.path}`
    : `${operation.method}-${operation.path}`;
  const rawId = slug(`${operationKey}-${mutation.key}`);
  const id = uniqueId(rawId, ids);

  cases.push({
    id,
    category: mutation.category,
    title: `${operation.method} ${operation.path}: ${mutation.title}`,
    operation: {
      ...(operation.operationId ? { operationId: operation.operationId } : {}),
      method: operation.method,
      path: operation.path,
    },
    request,
    expected: expected
      ? {
          statusCode: expected.statusCode,
          statusCodeSource: 'openapi',
          responseSchema: expected.responseSchema,
        }
      : { statusCode: null, statusCodeSource: 'unspecified', responseSchema: null },
    preconditions: securityPreconditions(operation),
    executionReadiness: needsOracle ? 'needs_oracle' : 'ready',
  });
}

function expectedResponse(
  operation: AnalyzedApiOperation,
  category: TestCaseCategory,
  field?: string,
  failure?: Mutation['failure']
): { statusCode: number | StatusCodeRange; responseSchema: JsonObject | null; needsOracle: boolean } | undefined {
  const response = operation.responses.find((candidate) =>
    category === 'negative'
      ? isValidationResponse(candidate.statusKey, candidate.description, field, failure)
      : isSuccessResponse(candidate.statusKey, candidate.description)
  );
  if (!response) return undefined;
  const statusCode = parseStatusCode(response.statusKey);
  if (statusCode === undefined) return undefined;
  const rawSchema = response.content.length === 1 ? response.content[0].schema : null;
  const responseSchema = rawSchema ? toJsonObject(rawSchema) : null;
  return {
    statusCode,
    responseSchema,
    needsOracle: rawSchema !== null && responseSchema === null,
  };
}

function isSuccessResponse(statusKey: string, description: string): boolean {
  const code = parseStatusCode(statusKey);
  return (
    ((typeof code === 'number' && code >= 200 && code < 300) || code === '2XX') &&
    /\b(success(?:ful(?:ly)?)?|created|returned|retrieved|found|updated|deleted|accepted|completed|no content|ok)\b/i.test(description) &&
    !/\b(failed|failure|error|not found)\b/i.test(description)
  );
}

function isValidationResponse(
  statusKey: string,
  description: string,
  field?: string,
  failure?: Mutation['failure']
): boolean {
  const code = parseStatusCode(statusKey);
  if (!((typeof code === 'number' && code >= 400 && code < 500) || code === '4XX')) return false;
  if (/\b(validation error|request validation|invalid request|invalid input|validation failed)\b/i.test(description)) return true;
  if (!field || !failure) return false;
  const normalized = field.replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
  const keyword = failure === 'missing' ? /\b(missing|required|omitted)\b/i
    : failure === 'minimum' ? /\b(minimum|min length|too short|below|at least)\b/i
      : failure === 'maximum' ? /\b(maximum|max length|too long|above|at most)\b/i
        : /\b(invalid|type|enum|allowed|constraint)\b/i;
  return normalized.length > 0 && description.toLowerCase().includes(normalized) && keyword.test(description);
}

function parseStatusCode(statusKey: string): number | StatusCodeRange | undefined {
  if (statusKey === '1XX') return '1XX';
  if (statusKey === '2XX') return '2XX';
  if (statusKey === '3XX') return '3XX';
  if (statusKey === '4XX') return '4XX';
  if (statusKey === '5XX') return '5XX';
  if (!/^\d{3}$/.test(statusKey)) return undefined;
  const code = Number(statusKey);
  return code >= 100 && code <= 599 ? code : undefined;
}

function schemaType(schema: Record<string, unknown>): string | undefined {
  if (typeof schema.type === 'string') return schema.type;
  if (schema.properties !== undefined || schema.required !== undefined) return 'object';
  if (schema.items !== undefined) return 'array';
  return undefined;
}

function hasOtherConstraints(schema: Record<string, unknown>): boolean {
  return ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength', 'pattern', 'format', 'enum', 'properties', 'required', 'items'].some((key) => schema[key] !== undefined);
}

function hasUnsupportedConstraint(schema: Record<string, unknown>): boolean {
  const supportedFormats = ['email', 'date', 'date-time', 'uuid', 'uri', 'url'];
  return schema.pattern !== undefined ||
    (typeof schema.format === 'string' && !supportedFormats.includes(schema.format)) ||
    schema.allOf !== undefined || schema.anyOf !== undefined || schema.oneOf !== undefined || schema.not !== undefined;
}

function documentedSample(schema: Record<string, unknown>): boolean {
  return schema.example !== undefined || (Array.isArray(schema.enum) && schema.enum.length > 0);
}

function locationRoot(location: AnalyzedParameter['location']): Exclude<RequestRoot, 'body'> {
  switch (location) {
    case 'path': return 'pathParams';
    case 'query': return 'queryParams';
    case 'header': return 'headers';
    case 'cookie': return 'cookies';
  }
}

function requestCollection(
  request: PlannerTestCase['request'],
  location: AnalyzedParameter['location']
): JsonObject {
  return request[locationRoot(location)];
}

function setValue(
  request: PlannerTestCase['request'],
  root: RequestRoot,
  path: Segment[],
  value: JsonValue
): boolean {
  if (root === 'body' && path.length === 0) {
    request.body = value;
    return true;
  }
  let current: JsonValue | JsonObject = request[root];
  for (const part of path.slice(0, -1)) {
    if (typeof part === 'string' && isJsonObject(current)) current = current[part];
    else if (typeof part === 'number' && Array.isArray(current)) current = current[part];
    else return false;
    if (current === undefined || current === null || typeof current !== 'object') return false;
  }
  const last = path[path.length - 1];
  if (typeof last === 'string' && isJsonObject(current)) {
    current[last] = value;
    return true;
  }
  if (typeof last === 'number' && Array.isArray(current) && last < current.length) {
    current[last] = value;
    return true;
  }
  return false;
}

function removeValue(request: PlannerTestCase['request'], root: RequestRoot, path: Segment[]): boolean {
  if (path.length === 0) return false;
  let current: JsonValue | JsonObject = request[root];
  for (const part of path.slice(0, -1)) {
    if (typeof part === 'string' && isJsonObject(current)) current = current[part];
    else if (typeof part === 'number' && Array.isArray(current)) current = current[part];
    else return false;
    if (current === undefined || current === null || typeof current !== 'object') return false;
  }
  const last = path[path.length - 1];
  if (typeof last === 'string' && isJsonObject(current) && last in current) {
    delete current[last];
    return true;
  }
  if (typeof last === 'number' && Array.isArray(current) && last < current.length) {
    current.splice(last, 1);
    return true;
  }
  return false;
}

function securityPreconditions(operation: AnalyzedApiOperation): string[] {
  const requirements = operation.security
    .map((item) => Object.keys(item).join(' + '))
    .filter(Boolean);
  return requirements.length ? [`Satisfy documented security requirement(s): ${requirements.join(' OR ')}.`] : [];
}

function integerConstraint(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonObject(value: JsonValue | JsonObject): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown, seen = new WeakSet<object>()): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || seen.has(value)) return undefined;
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const converted = value.map((item) => toJsonValue(item, seen));
      return converted.every((item) => item !== undefined) ? converted as JsonValue[] : undefined;
    }
    const result: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      const converted = toJsonValue(child, seen);
      if (converted === undefined) return undefined;
      result[key] = converted;
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

function toJsonObject(value: Record<string, unknown>): JsonObject | null {
  const converted = toJsonValue(value);
  return converted !== undefined && isJsonObject(converted) ? converted : null;
}

function cloneValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isJsonObject(value)) {
    const result: JsonObject = {};
    for (const [key, child] of Object.entries(value)) result[key] = cloneValue(child);
    return result;
  }
  return value;
}

function cloneRequest(request: PlannerTestCase['request']): PlannerTestCase['request'] {
  return {
    pathParams: cloneObject(request.pathParams),
    queryParams: cloneObject(request.queryParams),
    headers: cloneObject(request.headers),
    cookies: cloneObject(request.cookies),
    body: cloneValue(request.body),
  };
}

function cloneObject(value: JsonObject): JsonObject {
  const result: JsonObject = {};
  for (const [key, child] of Object.entries(value)) result[key] = cloneValue(child);
  return result;
}

function uniqueByValue<T extends { value: JsonValue }>(values: T[]): T[] {
  const seen = new Set<string>();
  return values.filter(({ value }) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'scenario';
}

function uniqueId(value: string, ids: Set<string>): string {
  if (!ids.has(value)) {
    ids.add(value);
    return value;
  }
  let suffix = 2;
  while (ids.has(`${value}-${suffix}`)) suffix += 1;
  const id = `${value}-${suffix}`;
  ids.add(id);
  return id;
}
