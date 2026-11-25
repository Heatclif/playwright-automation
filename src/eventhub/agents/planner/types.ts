export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type TestCaseCategory = 'positive' | 'negative' | 'boundary' | 'edge';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE';

export type StatusCodeRange = '1XX' | '2XX' | '3XX' | '4XX' | '5XX';

export interface PlannerOutput {
  contractVersion: '1.0';
  source: {
    openApiVersion: string;
    title: string;
    version: string;
  };
  testCases: PlannerTestCase[];
}

export interface PlannerTestCase {
  id: string;
  category: TestCaseCategory;
  title: string;
  operation: {
    operationId?: string;
    method: HttpMethod;
    path: string;
  };
  request: {
    pathParams: JsonObject;
    queryParams: JsonObject;
    headers: JsonObject;
    cookies: JsonObject;
    body: JsonValue;
  };
  expected: {
    statusCode: number | StatusCodeRange | null;
    statusCodeSource: 'openapi' | 'unspecified';
    responseSchema: JsonObject | null;
  };
  preconditions: string[];
  executionReadiness: 'ready' | 'needs_oracle';
}
