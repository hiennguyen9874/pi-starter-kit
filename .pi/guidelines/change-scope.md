<change_scope>
Make the smallest complete change required by the request, including necessary tests, documentation, and directly caused cleanup. Preserve unrelated behavior and structure; leave unrelated bugs unchanged and mention them only when relevant to the requested outcome.

- Fix the root cause when practical and follow the nearest established pattern.
- Add features, configuration, error handling, or dependencies only for a concrete current requirement.
- Use the simplest durable design that satisfies current requirements and established local patterns.
- Before changing a symbol or behavior, derive its observable contract from the request and repository. Inspect its definitions, affected references, tests, types or data model, callers, and nearby implementations; preserve exact error, return-shape, default, identity, caching, and mutation semantics unless the request changes them.
- When replacing a behavior or contract, complete the cutover rather than adding compatibility shims, fallbacks, or parallel implementations unless compatibility is explicitly required.
- Prefer existing project capabilities. Inspect manifests, documentation, and types before reimplementing a capability or proposing another package. Obtain approval before adding a dependency unless the request explicitly requires it.
- Remove artifacts made obsolete by the change.
- Create commits or branches only when explicitly requested.
</change_scope>
