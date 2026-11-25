# Planner OpenAPI loader

The Planner loader accepts a local OpenAPI file path with a `.json`, `.yaml`, or `.yml` extension. The current supported specification range is **OpenAPI 3.0.x**, matching the repository's representative `openapi.json` (3.0.0). Other versions are rejected explicitly until support is added and tested.

The loader uses Swagger Parser to parse and validate the document and resolve internal `$ref` references. External `$ref` values are rejected before validation; the parser's external and HTTP resolvers are disabled. The loader does not fetch remote specifications, read external reference files, extract operations, or generate test cases.

Malformed input, invalid OpenAPI documents, unsupported versions, external references, and unsupported file extensions produce explicit errors.
