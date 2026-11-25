import { analyzeOpenApiDocument } from './operation-analyzer';
import type { OpenApiDocument } from './openapi-loader';
import { loadOpenApiDocument } from './openapi-loader';
import { parsePlannerOutput } from './output-validator';
import { generateScenarios } from './scenario-generator';
import type { PlannerOutput } from './types';

export async function planOpenApiFile(filePath: string): Promise<PlannerOutput> {
  const document = await loadOpenApiDocument(filePath);
  return buildPlannerOutput(document);
}

export function buildPlannerOutput(document: OpenApiDocument): PlannerOutput {
  const operations = analyzeOpenApiDocument(document);
  return parsePlannerOutput({
    contractVersion: '1.0',
    source: {
      openApiVersion: document.openapi,
      title: document.info.title,
      version: document.info.version,
    },
    testCases: generateScenarios(operations),
  });
}
