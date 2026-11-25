# Planner pipeline

`planOpenApiFile(filePath)` is the file-based Planner entry point. It passes a local JSON or YAML OpenAPI 3.0.x document through the loader, operation analyzer, deterministic scenario generator, and PlannerOutput v1 validator.

The envelope's `source` fields come directly from the OpenAPI `openapi` version and `info.title` / `info.version`. `buildPlannerOutput(document)` supports callers that already have a validated document; it uses the same analysis, generation, assembly, and final runtime validation path.

The pipeline returns only a schema-valid `PlannerOutput`. Loader, analyzer, and validation errors propagate with their explicit messages. This layer does not invoke an LLM/provider, execute API requests, or generate Playwright specs.

Run the standalone CLI with `npm run planner -- <openapi-file.json|openapi-file.yaml>`. It writes only the validated JSON to stdout; usage and Planner errors go to stderr with a non-zero exit code. Redirect stdout if you want to save the JSON output.
