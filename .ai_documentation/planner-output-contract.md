# Planner output contract

`PlannerOutput` v1 is the versioned JSON handoff from the future OpenAPI Planner to the API test Generator. The machine-readable contract is [planner-output.schema.json](planner-output.schema.json). A future Generator must validate this contract before generating tests.

## Contract rules

- `contractVersion` is `"1.0"`. Changes that break consumers require a new contract version.
- `source` identifies the OpenAPI document. `openApiVersion` is the version declared by that document; it is not the Planner contract version.
- `testCases` is a flat list. Each case carries its operation so a consumer does not need to infer which operation it belongs to.
- `id` is deterministic and unique within one plan. It should be derived from the operation and scenario, not from randomness or the current time.
- `category` is one of `positive`, `negative`, `boundary`, or `edge`.
- `request` always includes `pathParams`, `queryParams`, `headers`, `cookies`, and `body`. Parameter collections contain JSON-compatible values; use empty objects when there are none and `null` when there is no request body.
- `expected.statusCode` is an exact documented HTTP code or a documented OpenAPI response range such as `"2XX"`. `statusCodeSource` must be `openapi` for these values. Do not turn a range into an invented exact code.
- A `default` response key does not establish a specific expected status for this contract. If there is no usable expected status, use `statusCode: null`, `statusCodeSource: "unspecified"`, and `responseSchema: null`; mark the case `executionReadiness: "needs_oracle"`. Do not guess server behavior.
- `responseSchema` contains the documented response schema when available, otherwise `null`. A case may be `ready` with a documented status and no response schema if a status-only assertion is sufficient.
- `preconditions` contains explicit setup requirements as strings. Do not imply setup data or state that the OpenAPI document does not provide.
- The contract is provider-independent. It describes test intent and expectations, not an LLM prompt or a test-runner implementation.

## Example

[planner-output.example.json](planner-output.example.json) is a valid v1 example. Contract tests validate this exact file against the schema.
