# Planner scenario generation

The deterministic scenario generator consumes `AnalyzedApiOperation[]` and returns `PlannerTestCase[]`. The [Planner pipeline](planner-pipeline.md) assembles and validates the final `PlannerOutput` envelope.

The generator does not execute API requests or use an LLM/provider.

It builds request candidates from documented examples and enum values first, then uses deterministic values based on the declared schema type and supported constraints. Positive, negative, boundary, and edge cases are emitted only when grounded in operation parameters, request-body schemas, examples, enums, or constraints. Negative mutations change one request condition at a time; unsupported schema constructs and uncertain values mark the case `needs_oracle`.

Expected statuses are included only when a response description clearly identifies a success or validation response for that scenario. A response status key by itself is not enough. Undocumented or ambiguous expectations use `statusCode: null`, `statusCodeSource: "unspecified"`, and `executionReadiness: "needs_oracle"`. Documented status ranges are preserved.

Path parameters without documented examples or enum values are generated deterministically but require an oracle because the value may depend on resource state. Security requirements are recorded as preconditions, not turned into invented credentials.
