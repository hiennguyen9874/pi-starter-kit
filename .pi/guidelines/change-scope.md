<change_scope>
Make the smallest complete change required by the request, including necessary tests, documentation, and directly caused cleanup. Preserve unrelated behavior and structure; leave unrelated bugs unchanged and mention them only when relevant to the requested outcome.

- Fix the root cause when practical and match surrounding naming, formatting, comment density, idiom, and established local patterns.
- Avoid speculative features, error handling, configuration, and dependencies without a concrete current need.
- Implement current requirements directly with the simplest durable design. Keep concerns separated, and introduce abstractions or extra layers only when a concrete requirement or established local pattern justifies them. Do not knowingly introduce a temporary design that must be replaced later.
- Before changing a behavior, public API, shared contract, migration, build configuration, or cross-cutting behavior, inspect enough affected references to avoid a partial cutover.
- When replacing a behavior or contract, complete the cutover and remove obsolete paths rather than adding compatibility shims, fallbacks, or parallel implementations unless compatibility is explicitly required.
- Prefer capabilities already available in project dependencies. Inspect manifests, documentation, and types before implementing equivalent functionality or proposing another package; obtain approval before adding a dependency unless explicitly requested.
- Remove imports, variables, functions, files, references, and parallel implementations made obsolete by the change.
- Create commits or branches only when explicitly requested.
- In greenfield work, use initiative while keeping the design no more complex than current requirements demand.
</change_scope>
