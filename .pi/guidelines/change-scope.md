<change_scope>
Make the smallest complete change required by the request. Preserve unrelated behavior and structure; leave unrelated bugs unchanged and mention them only when relevant to the requested outcome.

- Fix the root cause when practical and follow the nearest established pattern.
- Add features, configuration, error handling, or dependencies only for a concrete current requirement.
- Use the simplest durable design that satisfies current requirements and established local patterns.
- Treat public contracts and cross-cutting behavior as requiring a complete cutover.
- When replacing a behavior or contract, complete the cutover rather than adding compatibility shims, fallbacks, or parallel implementations unless compatibility is explicitly required.
- Prefer existing project capabilities. Obtain approval before adding a dependency unless the request explicitly requires it.
- Remove artifacts made obsolete by the change.
- Create commits or branches only when explicitly requested.
</change_scope>
