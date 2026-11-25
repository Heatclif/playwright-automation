# Planner operation analyzer

The analyzer consumes a validated document from the [OpenAPI loader](planner-openapi-loader.md) and returns one typed operation record for each path/method pair. It reports operation metadata, effective security requirements, merged parameters, request-body media types and schemas, and documented response keys, headers, media types, and schemas.

Parameter schemas are preserved intact so declared constraints such as `minimum`, `maxLength`, `enum`, `format`, and `pattern` remain available to later Planner steps. Path-level parameters are merged with operation-level parameters by `(name, in)`; an operation-level parameter replaces a matching path-level parameter.

An operation's `security` overrides document-level `security`; when the operation does not define it, the document-level value is inherited. No security requirement is represented as an empty list. The analyzer does not generate test scenarios or infer undocumented behavior.
