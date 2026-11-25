import Ajv2020 from 'ajv/dist/2020';
import type { AnySchema } from 'ajv';
import type { PlannerOutput } from './types';

const plannerOutputSchema: AnySchema = require('../../../../.ai_documentation/planner-output.schema.json');
const validate = new Ajv2020({ allErrors: true }).compile<PlannerOutput>(plannerOutputSchema);

export function parsePlannerOutput(input: unknown): PlannerOutput {
  if (isPlannerOutput(input)) {
    return input;
  }

  const details = (validate.errors ?? [])
    .map((error) => `${error.instancePath || '/'} ${error.message ?? error.keyword}`)
    .join('; ');

  throw new Error(`Invalid PlannerOutput v1: ${details || 'schema validation failed'}`);
}

function isPlannerOutput(input: unknown): input is PlannerOutput {
  const result = validate(input);
  if (typeof result !== 'boolean') {
    throw new Error('PlannerOutput validation must use a synchronous JSON Schema.');
  }
  return result;
}
