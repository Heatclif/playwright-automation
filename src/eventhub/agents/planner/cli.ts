import { planOpenApiFile } from './planner';

async function main(): Promise<void> {
  const [filePath, ...extraArguments] = process.argv.slice(2);
  if (!filePath || extraArguments.length > 0) {
    console.error('Usage: npm run planner -- <openapi-file.json|openapi-file.yaml>');
    process.exitCode = 2;
    return;
  }

  try {
    const output = await planOpenApiFile(filePath);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Planner failed: ${message}`);
    process.exitCode = 1;
  }
}

void main();
