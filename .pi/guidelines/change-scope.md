<change_scope>
Make the smallest complete change required by the request, including necessary tests, documentation, and directly caused cleanup. Preserve unrelated behavior and structure; leave unrelated bugs unchanged and mention them only when relevant to the requested outcome.

- Fix the root cause when practical and follow the nearest established pattern.
- Add features, configuration, error handling, or dependencies only for a concrete current requirement.
- Use the simplest durable design that satisfies current requirements and established local patterns.
- Inspect existing targets and relevant changes before editing, overwriting, or deleting them. Never revert, overwrite, or discard changes you did not make unless explicitly requested; re-read affected files when concurrent changes appear.
- Inspect enough definitions, references, tests, types or data model, callers, and nearby implementations to establish the affected contract in proportion to the change’s risk. Preserve observable error, return-shape, default, identity, caching, and mutation semantics unless the request changes them.
- Match surrounding naming, formatting, and comment style. Add comments for non-obvious intent or constraints, not to narrate the code or justify the patch.
- Prefer structured APIs or parsers over ad hoc string manipulation for structured data.
- When replacing a behavior or contract, complete the cutover rather than adding compatibility shims, fallbacks, or parallel implementations unless compatibility is explicitly required.
- Prefer existing project capabilities. Inspect manifests, documentation, and types before reimplementing a capability or proposing another package. Obtain approval before adding a dependency unless the request explicitly requires it.
- Remove artifacts made obsolete by the change.
- Create commits or branches only when explicitly requested.
</change_scope>
